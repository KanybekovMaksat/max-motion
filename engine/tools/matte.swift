// Person matte + subject box via Apple Vision, no Python needed.
//   swift tools/matte.swift box  <video>             -> JSON {cx, cy, w, h} (normalized, averaged over sampled frames)
//   swift tools/matte.swift mask <video> <outDir>    -> grayscale PNG per frame: 000001.png ...
import AVFoundation
import CoreImage
import Foundation
import Vision

let args = CommandLine.arguments
guard args.count >= 3 else {
  FileHandle.standardError.write("usage: matte.swift box|mask <video> [outDir]\n".data(using: .utf8)!)
  exit(1)
}
let mode = args[1]
let url = URL(fileURLWithPath: args[2])
let asset = AVURLAsset(url: url)
let sem = DispatchSemaphore(value: 0)
var track: AVAssetTrack?
Task {
  track = try? await asset.loadTracks(withMediaType: .video).first
  sem.signal()
}
sem.wait()
guard let vt = track else { print("no video track"); exit(1) }

let reader = try AVAssetReader(asset: asset)
let out = AVAssetReaderTrackOutput(
  track: vt, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
out.alwaysCopiesSampleData = false
reader.add(out)
reader.startReading()

let ctx = CIContext(options: [.workingColorSpace: NSNull()])
var frame = 0

if mode == "box" {
  var sx = 0.0, sy = 0.0, sw = 0.0, sh = 0.0, n = 0.0
  while let sample = out.copyNextSampleBuffer() {
    defer { frame += 1 }
    if frame % 10 != 0 { continue }
    guard let pb = CMSampleBufferGetImageBuffer(sample) else { continue }
    let req = VNDetectHumanRectanglesRequest()
    req.upperBodyOnly = false
    try? VNImageRequestHandler(cvPixelBuffer: pb).perform([req])
    let faces = VNDetectFaceRectanglesRequest()
    try? VNImageRequestHandler(cvPixelBuffer: pb).perform([faces])
    let body = (req.results ?? []).max(by: { $0.boundingBox.width * $0.boundingBox.height < $1.boundingBox.width * $1.boundingBox.height })
    let face = (faces.results ?? []).max(by: { $0.boundingBox.width < $1.boundingBox.width })
    guard let b = face?.boundingBox ?? body?.boundingBox else { continue }
    // Vision is bottom-left origin; flip to top-left.
    sx += b.midX; sy += 1 - b.midY; sw += b.width; sh += b.height; n += 1
  }
  if n == 0 { print("{\"cx\":0.5,\"cy\":0.4,\"w\":0,\"h\":0}"); exit(0) }
  print(String(format: "{\"cx\":%.4f,\"cy\":%.4f,\"w\":%.4f,\"h\":%.4f}", sx / n, sy / n, sw / n, sh / n))
  exit(0)
}

guard mode == "mask", args.count >= 4 else { print("bad args"); exit(1) }
let dir = URL(fileURLWithPath: args[3])
try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
let seg = VNGeneratePersonSegmentationRequest()
seg.qualityLevel = .accurate
seg.outputPixelFormat = kCVPixelFormatType_OneComponent8
let gray = CGColorSpaceCreateDeviceGray()

// per frame: head top y and head centre x (output pixels), from the matte itself
var heads: [[Int]] = []

func headOf(_ m: CVPixelBuffer, _ w: Int, _ h: Int) -> [Int] {
  CVPixelBufferLockBaseAddress(m, .readOnly)
  defer { CVPixelBufferUnlockBaseAddress(m, .readOnly) }
  let mw = CVPixelBufferGetWidth(m), mh = CVPixelBufferGetHeight(m), row = CVPixelBufferGetBytesPerRow(m)
  let p = CVPixelBufferGetBaseAddress(m)!.assumingMemoryBound(to: UInt8.self)
  var top = -1
  for y in 0..<mh {
    var n = 0
    for x in 0..<mw where p[y * row + x] > 128 { n += 1 }
    if n > mw / 40 { top = y; break }
  }
  if top < 0 { return [-1, -1] }
  // centre of the head = mean x over a band below the top
  let band = min(mh - 1, top + mh / 12)
  var sx = 0, n = 0
  for y in top...band { for x in 0..<mw where p[y * row + x] > 128 { sx += x; n += 1 } }
  return [Int(Double(top) / Double(mh) * Double(h)), n > 0 ? Int(Double(sx) / Double(n) / Double(mw) * Double(w)) : w / 2]
}

while let sample = out.copyNextSampleBuffer() {
  frame += 1
  guard let pb = CMSampleBufferGetImageBuffer(sample) else { continue }
  let w = CVPixelBufferGetWidth(pb), h = CVPixelBufferGetHeight(pb)
  try VNImageRequestHandler(cvPixelBuffer: pb).perform([seg])
  guard let m = seg.results?.first?.pixelBuffer else { continue }
  heads.append(headOf(m, w, h))
  var img = CIImage(cvPixelBuffer: m)
  img = img.transformed(by: CGAffineTransform(scaleX: CGFloat(w) / img.extent.width, y: CGFloat(h) / img.extent.height))
  let file = dir.appendingPathComponent(String(format: "%06d.png", frame))
  try ctx.writePNGRepresentation(of: img, to: file, format: .L8, colorSpace: gray)
  if frame % 30 == 0 { FileHandle.standardError.write("mask \(frame)\n".data(using: .utf8)!) }
}
let json = try JSONSerialization.data(withJSONObject: heads)
try json.write(to: dir.appendingPathComponent("track.json"))
print(frame)
