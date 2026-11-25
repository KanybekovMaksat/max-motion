// Cut spans out of a prepped clip without prepping it again: base.mp4, fg.webm, track.json,
// faces.json, words.json and meta.json are all cut the same way, so the edit stays in sync.
// usage: node tools/trim.mjs <slug> 6.85-8.40,37.95-39.05 [--lang ru]
//   --lang: transcribe the trimmed clip again (whisper's times near a cut drift); hand fixes to words.json are lost
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transcribe } from "./prep.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ff = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: ["ignore", "pipe", "pipe"] });

// spans to drop -> spans to keep, inside [0, duration]
export function keepOf(drop, duration) {
  const d = [...drop].sort((a, b) => a[0] - b[0]);
  const keep = [];
  let t = 0;
  for (const [a, b] of d) {
    if (a > t) keep.push([t, a]);
    t = Math.max(t, b);
  }
  if (t < duration) keep.push([t, duration]);
  return keep;
}

// a time in the old clip -> the new one (null if it was cut)
export function remap(t, keep) {
  let acc = 0;
  for (const [a, b] of keep) {
    if (t >= a && t <= b) return acc + t - a;
    acc += b - a;
  }
  return null;
}

// words inside a cut disappear, the rest move up
export function trimWords(words, keep) {
  return words.flatMap((w) => {
    const s = remap(w.s, keep), e = remap(w.e, keep);
    return s === null ? [] : [{ ...w, s: +s.toFixed(3), e: +(e ?? s + 0.3).toFixed(3) }];
  });
}

function main() {
  const argv = process.argv.slice(2);
  const [slug, spec] = argv;
  const lang = argv.includes("--lang") ? argv[argv.indexOf("--lang") + 1] : null;
  if (!slug || !spec) {
    console.error("usage: node tools/trim.mjs <slug> 6.85-8.40,37.95-39.05 [--lang ru]");
    process.exit(1);
  }
  const dir = path.join(ROOT, "public", slug);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
  const keep = keepOf(spec.split(",").map((r) => r.split("-").map(Number)), meta.duration);
  const sel = keep.map(([a, b]) => `between(t,${a},${b})`).join("+");
  const tmp = (f) => path.join(dir, `.trim-${f}`);
  ff(["-i", path.join(dir, "base.mp4"), "-vf", `select='${sel}',setpts=N/FRAME_RATE/TB`, "-af", `aselect='${sel}',asetpts=N/SR/TB`, "-r", String(meta.fps), "-c:v", "libx264", "-crf", "15", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", tmp("base.mp4")]);
  // the cutout keeps its alpha: decode with libvpx, encode VP9 with alpha again
  ff(["-c:v", "libvpx-vp9", "-i", path.join(dir, "fg.webm"), "-vf", `select='${sel}',setpts=N/FRAME_RATE/TB,format=yuva420p`, "-r", String(meta.fps), "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "6M", "-auto-alt-ref", "0", "-row-mt", "1", "-deadline", "realtime", "-cpu-used", "4", "-an", tmp("fg.webm")]);
  fs.renameSync(tmp("base.mp4"), path.join(dir, "base.mp4"));
  fs.renameSync(tmp("fg.webm"), path.join(dir, "fg.webm"));
  // per-frame files lose the cut frames
  const kept = (_, f) => keep.some(([a, b]) => f / meta.fps >= a && f / meta.fps < b);
  for (const file of ["track.json", "faces.json"]) {
    const p = path.join(dir, file);
    if (fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(JSON.parse(fs.readFileSync(p, "utf8")).filter(kept)));
  }
  const words = JSON.parse(fs.readFileSync(path.join(dir, "words.json"), "utf8"));
  let next = trimWords(words, keep);
  if (lang) {
    const tmpDir = path.join(ROOT, ".cache", slug);
    fs.mkdirSync(tmpDir, { recursive: true });
    next = transcribe(path.join(dir, "base.mp4"), tmpDir, lang);
  }
  fs.writeFileSync(path.join(dir, "words.json"), JSON.stringify(next, null, 1));
  const was = meta.duration;
  meta.duration = keep.reduce((s, [a, b]) => s + b - a, 0);
  delete meta.lufs; // re-measured at render
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 2));
  console.log(`trim ${slug}: ${was.toFixed(2)}s → ${meta.duration.toFixed(2)}s (edit.json times are NOT moved — trim before you edit)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
