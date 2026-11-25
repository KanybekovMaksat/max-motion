// Multi-camera 16:9 footage (podcasts, interviews) -> a 9:16 clip that `prep` can take.
// Pieces of the source can be stitched first (--ranges), then every camera shot gets its own
// still crop on one person: close-ups centre the face, wide shots crop to the speaker and push in.
// usage: node tools/reframe.mjs <src> <out.mp4> [--ranges 12.1-27.6,63-70.5] [--side auto|left|right|"0-20:left,20-:right"]
//   --side picks the person in shots with several faces (time in the output clip); auto = the side
//   the nearest close-up's face sits on (podcast close-ups keep each speaker on their own side).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { measure } from "./audio.mjs";
import { silences } from "./prep.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const W = 1080, H = 1920, FPS = 30;
const run = (cmd, args) => execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 28 }).toString();
const ff = (args) => run("ffmpeg", ["-v", "error", "-y", ...args]);

// a face this wide (share of the frame width) or more = a close-up
export const CLOSE = 0.075;

// "12.1-27.6,63-70.5" -> [[12.1, 27.6], [63, 70.5]]
export const parseRanges = (s) => s.split(",").map((r) => r.split("-").map(Number));

// Range edges picked from whisper word times are off by up to half a second, so each edge moves
// out to the nearest real pause (within `reach` s): the first and last words are never clipped.
export function snapRanges(ranges, sil, reach = 0.8) {
  return ranges.map(([a, b]) => {
    const before = sil.filter(([, e]) => e <= a + 0.1 && e >= a - reach).map(([, e]) => e);
    const after = sil.filter(([s]) => s >= b - 0.1 && s <= b + reach).map(([s]) => s);
    const a2 = before.length ? Math.max(...before) - 0.1 : a - 0.1;
    const b2 = after.length ? Math.min(...after) + 0.1 : b + 0.1;
    return [Math.max(0, +a2.toFixed(3)), +b2.toFixed(3)];
  });
}

// "0-20:left,20-:right" -> (t) => side
export function sideAt(spec = "auto") {
  if (!spec.includes(":")) return () => spec;
  const rules = spec.split(",").map((r) => {
    const [span, side] = r.split(":");
    const [a, b] = span.split("-");
    return { a: Number(a || 0), b: b ? Number(b) : Infinity, side };
  });
  return (t) => rules.find((r) => t >= r.a && t < r.b)?.side ?? "auto";
}

// cut times -> shots [{s, e}], shots under `min` seconds merged into the previous one
export function shotsOf(cuts, duration, min = 0.4) {
  const out = [];
  let s = 0;
  for (const c of [...cuts, duration]) {
    if (c - s < min && out.length) out[out.length - 1].e = c;
    else if (c - s >= min || !out.length) out.push({ s, e: c });
    s = c;
  }
  return out;
}

const median = (xs) => {
  const a = [...xs].sort((p, q) => p - q);
  return a.length ? a[Math.floor(a.length / 2)] : 0.5;
};

// one shot's faces (samples of [[cx, cy, w, h], …]) -> the person to frame
// close-up: the biggest face; wide: the face on `side` (left/right), else the biggest
export function pickFace(samples, side) {
  const all = samples.flat();
  if (!all.length) return null;
  const big = Math.max(...all.map((f) => f[2]));
  const close = big >= CLOSE;
  // the person in each sample, then the median over the shot (a still crop, like a camera operator)
  // (faces under half the biggest one are people far behind or false hits)
  const chosen = samples
    .map((fs) => fs.filter((f) => f[2] >= big * 0.45))
    .filter((real) => real.length)
    .map((real) => {
      if (close || side === "auto" || real.length < 2) return real.reduce((a, b) => (b[2] > a[2] ? b : a));
      return real.reduce((a, b) => (side === "left" ? (b[0] < a[0] ? b : a) : b[0] > a[0] ? b : a));
    });
  return { cx: median(chosen.map((f) => f[0])), cy: median(chosen.map((f) => f[1])), w: median(chosen.map((f) => f[2])), h: median(chosen.map((f) => f[3])), close };
}

// crop window (source pixels) for a face: close-ups take the full height, wide shots push in
// to 80 % of it so the person isn't a speck; the face sits at ~36 % from the top
export function cropOf(face, sw, sh) {
  const ch = Math.round(face.close ? sh : sh * 0.8);
  const cw = Math.round((ch * W) / H);
  const x = Math.min(Math.max(face.cx * sw - cw / 2, 0), sw - cw);
  const y = Math.min(Math.max(face.cy * sh - ch * 0.36, 0), sh - ch);
  return { x: Math.round(x), y: Math.round(y), w: cw - (cw % 2), h: ch - (ch % 2) };
}

function main() {
  const argv = process.argv.slice(2);
  const [src, out] = argv;
  const opt = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : undefined);
  if (!src || !out) {
    console.error('usage: node tools/reframe.mjs <src> <out.mp4> [--ranges 12.1-27.6,63-70.5] [--side auto|left|right|"0-20:left,20-:right"]');
    process.exit(1);
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "reframe-"));
  // 1. stitch the ranges (frame-accurate, re-encoded)
  let clip = path.join(tmp, "clip.mp4");
  const lufs = measure(src) ?? -24;
  const ranges = opt("--ranges") ? snapRanges(parseRanges(opt("--ranges")), silences(src, Math.max(-50, Math.min(-30, Math.round(lufs - 16))), 0.12)) : null;
  if (ranges) console.log(`ranges (snapped to pauses): ${ranges.map(([a, b]) => `${a}-${b}`).join(",")}`);
  if (ranges) {
    const parts = ranges.map(([a, b], i) => `[0:v]trim=${a}:${b},setpts=PTS-STARTPTS,fps=${FPS}[v${i}];[0:a]atrim=${a}:${b},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=${(b - a - 0.03).toFixed(3)}:d=0.03[a${i}]`);
    const cat = ranges.map((_, i) => `[v${i}][a${i}]`).join("") + `concat=n=${ranges.length}:v=1:a=1[v][a]`;
    ff(["-i", src, "-filter_complex", parts.join(";") + ";" + cat, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "14", "-preset", "fast", "-c:a", "aac", "-b:a", "192k", clip]);
  } else {
    ff(["-i", src, "-r", String(FPS), "-c:v", "libx264", "-crf", "14", "-preset", "fast", "-c:a", "aac", "-b:a", "192k", clip]);
  }
  const probe = JSON.parse(run("ffprobe", ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", clip]));
  const v = probe.streams.find((s) => s.codec_type === "video");
  const sw = v.width, sh = v.height, duration = Number(probe.format.duration);

  // 2. camera cuts (plus the joins between ranges, which are cuts too)
  const scene = run("ffmpeg", ["-v", "error", "-i", clip, "-an", "-vf", "select='gt(scene,0.22)',metadata=print:file=-", "-f", "null", "-"]);
  const cuts = [...scene.matchAll(/pts_time:([\d.]+)/g)].map((m) => Number(m[1]));
  let acc = 0;
  for (const [a, b] of ranges ?? []) cuts.push((acc += b - a));
  const shots = shotsOf([...new Set(cuts.map((c) => Math.round(c * 100) / 100))].filter((c) => c > 0.05 && c < duration - 0.05).sort((a, b) => a - b), duration);

  // 3. faces every 5th frame, grouped by shot
  const faces = JSON.parse(run(path.join(ROOT, "tools", "matte"), ["faces", clip]));
  const side = sideAt(opt("--side"));
  const picked = shots.map((sh_) => {
    const samples = faces.filter(([f]) => f / FPS >= sh_.s && f / FPS < sh_.e).map(([, fs]) => fs);
    return { ...sh_, samples };
  });
  // auto side for wide shots: where the nearest close-up's face sits
  const closeSide = picked.map((p) => {
    const f = pickFace(p.samples, "auto");
    return f && f.close ? (f.cx < 0.5 ? "left" : "right") : null;
  });
  const found = picked.map((p, i) => {
    let s = side((p.s + p.e) / 2);
    if (s === "auto") {
      for (let d = 1; d < picked.length && s === "auto"; d++) s = closeSide[i - d] ?? closeSide[i + d] ?? "auto";
    }
    return { s: p.s, e: p.e, side: s, face: pickFace(p.samples, s) };
  });
  // a shot without a face (hands, the table, a profile turned away) keeps the neighbour's framing
  const plan = found.map((p, i) => {
    let face = p.face;
    for (let d = 1; !face && d < found.length; d++) face = found[i - d]?.face ?? found[i + d]?.face;
    face ??= { cx: 0.5, cy: 0.35, w: 0, h: 0, close: true };
    return { ...p, face, crop: cropOf(face, sw, sh) };
  });

  // 4. crop each shot, scale to 1080x1920, join
  const segs = plan.map((p, i) => `[0:v]trim=${p.s}:${p.e},setpts=PTS-STARTPTS,crop=${p.crop.w}:${p.crop.h}:${p.crop.x}:${p.crop.y},scale=${W}:${H}:flags=lanczos,${p.face.close ? "" : "unsharp=5:5:0.6,"}setsar=1[s${i}]`);
  ff(["-i", clip, "-filter_complex", segs.join(";") + ";" + plan.map((_, i) => `[s${i}]`).join("") + `concat=n=${plan.length}:v=1:a=0[v]`, "-map", "[v]", "-map", "0:a", "-r", String(FPS), "-c:v", "libx264", "-crf", "14", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy", out]);
  fs.writeFileSync(out.replace(/\.mp4$/, ".shots.json"), JSON.stringify(plan.map(({ s, e, side: sd, face, crop }) => ({ s: +s.toFixed(2), e: +e.toFixed(2), close: face.close, side: sd, crop })), null, 1));
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`reframe → ${out}  (${plan.length} shots, ${plan.filter((p) => !p.face.close).length} wide)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
