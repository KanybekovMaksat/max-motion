// Raw clip -> everything the edit needs, in public/<slug>/:
//   base.mp4    1080x1920 30fps, face-centred 9:16 crop
//   fg.webm     the person only (VP9 alpha) — goes ABOVE text/graphics, that's the "word behind head" trick
//   words.json  word timings from whisper.cpp
//   meta.json   duration, face box
// usage: npm run prep -- <video> <slug> [--lang ru|en|auto]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { measure } from "./audio.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const W = 1080, H = 1920, FPS = 30;

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 28, ...opts }).toString();
const ff = (args) => run("ffmpeg", ["-v", "error", "-y", ...args]);

export function probe(file) {
  const j = JSON.parse(run("ffprobe", ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", file]));
  const v = j.streams.find((s) => s.codec_type === "video");
  return { duration: Number(j.format.duration), hasAudio: j.streams.some((s) => s.codec_type === "audio"), width: v.width, height: v.height };
}

// Face-centred crop window for a 9:16 frame inside an upright source of size sw x sh.
export function cropFor(sw, sh, box) {
  const target = W / H;
  let cw = sw, ch = sh;
  if (sw / sh > target) cw = Math.round(sh * target);
  else ch = Math.round(sw / target);
  // face sits at ~38% from the top, like the references
  const x = Math.round(Math.min(Math.max(box.cx * sw - cw / 2, 0), sw - cw));
  const y = Math.round(Math.min(Math.max(box.cy * sh - ch * 0.38, 0), sh - ch));
  return { w: cw - (cw % 2), h: ch - (ch % 2), x, y };
}

// Normalized face box in the upright source -> pixel box in the 1080x1920 output.
export function facePx(box, up, c) {
  const k = W / c.w;
  return {
    x: Math.round((box.cx * up.width - c.x) * k),
    y: Math.round((box.cy * up.height - c.y) * k),
    w: Math.round(box.w * up.width * k),
    h: Math.round(box.h * up.height * k),
  };
}

// Raw per-frame [headTop, headX] -> smoothed {top, x} per frame; gaps (no person) borrow the neighbour.
export function smoothTrack(raw, win = 5) {
  const filled = raw.map((r) => (r[0] < 0 ? null : r));
  let last = filled.find(Boolean) ?? [400, 540];
  for (let i = 0; i < filled.length; i++) filled[i] = filled[i] ?? last, (last = filled[i]);
  return filled.map((_, i) => {
    let t = 0, x = 0, n = 0;
    for (let j = Math.max(0, i - win); j <= Math.min(filled.length - 1, i + win); j++) (t += filled[j][0]), (x += filled[j][1]), n++;
    return { top: Math.round(t / n), x: Math.round(x / n) };
  });
}

// whisper.cpp -ml 1 JSON -> [{w, s, e}] in seconds, punctuation glued to its word.
export function parseWords(whisperJson) {
  const out = [];
  for (const seg of whisperJson.transcription ?? []) {
    const raw = seg.text ?? "";
    const text = raw.trim();
    if (!text) continue;
    const s = seg.offsets.from / 1000, e = seg.offsets.to / 1000;
    if (/^[^\p{L}\p{N}]+$/u.test(text) && out.length) {
      out[out.length - 1].w += text;
      continue;
    }
    if (!/^\s/.test(raw) && out.length) {
      // no leading space = continuation of the previous word ("эффек" + "ты")
      out[out.length - 1].w += text;
      out[out.length - 1].e = e;
      continue;
    }
    // whisper glues leading silence onto a word; a spoken word rarely lasts over 0.7s
    out.push({ w: text, s: Math.max(s, e - 0.7), e });
  }
  return out;
}

// Spoken stretches to keep when cutting pauses: words padded a little, gaps over `gap` seconds dropped.
export function keepSegments(words, duration, gap = 0.3, pad = 0.08) {
  const segs = [];
  for (const w of words) {
    const s = Math.max(0, w.s - pad), e = Math.min(duration, w.e + pad + 0.04);
    const last = segs[segs.length - 1];
    if (last && s - last[1] <= gap) last[1] = Math.max(last[1], e);
    else segs.push([s, e]);
  }
  return segs.map(([s, e]) => [Math.round(s * 1000) / 1000, Math.round(e * 1000) / 1000]);
}

function transcribe(base, tmp, lang) {
  const wav = path.join(tmp, "a.wav");
  ff(["-i", base, "-ar", "16000", "-ac", "1", wav]);
  const model = path.join(ROOT, "models", "ggml-small.bin");
  run("whisper-cli", ["-m", model, "-l", lang, "-ml", "1", "-sow", "-oj", "-of", path.join(tmp, "w"), "-np", wav]);
  return parseWords(JSON.parse(fs.readFileSync(path.join(tmp, "w.json"), "utf8")));
}

function main() {
  const argv = process.argv.slice(2);
  const [src, slug] = argv;
  const lang = argv.includes("--lang") ? argv[argv.indexOf("--lang") + 1] : "auto";
  if (!src || !slug) {
    console.error("usage: npm run prep -- <video> <slug> [--lang ru|en|auto] [--cut]   (--cut removes pauses between phrases)");
    process.exit(1);
  }
  const dir = path.join(ROOT, "public", slug);
  const tmp = path.join(ROOT, ".cache", slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(tmp, { recursive: true });
  const info = probe(src);

  console.log("1/5 upright copy");
  const upright = path.join(tmp, "upright.mp4");
  ff(["-i", src, "-vf", "scale='if(gt(iw,ih),-2,1440)':'if(gt(iw,ih),1440,-2)'", "-r", String(FPS), "-an", "-c:v", "libx264", "-crf", "16", "-preset", "veryfast", upright]);
  const up = probe(upright);

  console.log("2/5 face box");
  const box = JSON.parse(run(path.join(ROOT, "tools", "matte"), ["box", upright]));
  const c = cropFor(up.width, up.height, box);

  console.log("3/5 9:16 base", c);
  const base = path.join(dir, "base.mp4");
  ff([
    "-i", upright, ...(info.hasAudio ? ["-i", src, "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "192k"] : []),
    "-vf", `crop=${c.w}:${c.h}:${c.x}:${c.y},scale=${W}:${H}:flags=lanczos,setsar=1`,
    "-r", String(FPS), "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-pix_fmt", "yuv420p", "-shortest", base,
  ]);

  console.log("4/5 words (whisper.cpp)");
  let words = info.hasAudio ? transcribe(base, tmp, lang) : [];
  if (argv.includes("--cut") && words.length) {
    const dur = probe(base).duration;
    const keep = keepSegments(words, dur);
    const kept = keep.reduce((a, [s, e]) => a + e - s, 0);
    if (dur - kept > 0.25) {
      console.log(`   cut pauses: ${dur.toFixed(2)}s → ${kept.toFixed(2)}s`);
      const sel = keep.map(([s, e]) => `between(t,${s},${e})`).join("+");
      const cut = path.join(tmp, "cut.mp4");
      ff(["-i", base, "-vf", `select='${sel}',setpts=N/FRAME_RATE/TB`, "-af", `aselect='${sel}',asetpts=N/SR/TB`, "-r", String(FPS), "-c:v", "libx264", "-crf", "15", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", cut]);
      fs.copyFileSync(cut, base);
      words = transcribe(base, tmp, lang);
    }
  }
  fs.writeFileSync(path.join(dir, "words.json"), JSON.stringify(words, null, 1));

  console.log("5/5 person matte (Apple Vision)");
  const masks = path.join(tmp, "mask");
  fs.rmSync(masks, { recursive: true, force: true });
  run(path.join(ROOT, "tools", "matte"), ["mask", base, masks]);
  // soften + slightly erode the edge so the cutout doesn't show a halo of background
  ff([
    "-i", base, "-framerate", String(FPS), "-i", path.join(masks, "%06d.png"),
    "-filter_complex", "[1:v]format=gray,erosion,gblur=sigma=1.6[m];[0:v][m]alphamerge,format=yuva420p[v]",
    "-map", "[v]", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "6M", "-auto-alt-ref", "0", "-row-mt", "1", "-deadline", "realtime", "-cpu-used", "4",
    path.join(dir, "fg.webm"),
  ]);

  fs.writeFileSync(path.join(dir, "track.json"), JSON.stringify(smoothTrack(JSON.parse(fs.readFileSync(path.join(masks, "track.json"), "utf8")))));

  const meta = { slug, duration: probe(base).duration, fps: FPS, width: W, height: H, face: facePx(box, up, c), lufs: measure(base) ?? undefined, source: path.resolve(src) };
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 2));
  console.log(`done → public/${slug}/  (${words.length} words: ${words.map((w) => w.w).join(" ")})`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
