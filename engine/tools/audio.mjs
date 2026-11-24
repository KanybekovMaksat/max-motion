// Audio levels: how loud the voice is (sound effects and music are scaled to it), the music bed
// for a clip, and the final loudness of the reel (-14 LUFS, what Reels / TikTok / Shorts play at).
// usage: node tools/audio.mjs music <slug> <file> [--start <sec in the track>] [--volume 0.4] [--duck 0.2]
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// the reference the sound library and the music are levelled against
export const VOICE_REF = -16;
export const TARGET = -14;

// integrated loudness (LUFS) of a file's audio; null when there is none
export function measure(file) {
  const r = spawnSync("ffmpeg", ["-nostats", "-i", file, "-vn", "-af", "ebur128", "-f", "null", "-"], { encoding: "utf8" });
  const m = [...(r.stderr ?? "").matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop();
  return m && Number(m[1]) > -70 ? Number(m[1]) : null;
}

// voice loudness of a prepped clip, cached in meta.json
export function voiceLufs(slug) {
  const file = path.join(ROOT, "public", slug, "meta.json");
  const meta = JSON.parse(fs.readFileSync(file, "utf8"));
  if (meta.lufs === undefined) {
    meta.lufs = measure(path.join(ROOT, "public", slug, "base.mp4")) ?? VOICE_REF;
    fs.writeFileSync(file, JSON.stringify(meta, null, 2));
  }
  return meta.lufs;
}

// final mix → -14 LUFS, peaks under -1 dBTP; the video stream is copied
export function master(mp4) {
  const now = measure(mp4);
  if (now === null) return;
  const tmp = mp4.replace(/\.mp4$/, ".master.mp4");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", mp4, "-c:v", "copy", "-af", `volume=${(TARGET - now).toFixed(1)}dB,alimiter=limit=0.89:level=false`, "-c:a", "aac", "-b:a", "256k", tmp]);
  fs.renameSync(tmp, mp4);
}

// music bed: the part of the track from `start`, compressed and levelled to the voice reference,
// saved as public/<slug>/music.mp3 and switched on in edit.json
export function music(slug, src, { start = 0, volume = 0.4, duck = 0.2 } = {}) {
  const dir = path.join(ROOT, "public", slug);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
  const out = path.join(dir, "music.mp3");
  const len = meta.duration + 0.5;
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-ss", String(start), "-t", String(len), "-i", src,
    "-af", `acompressor=threshold=-20dB:ratio=3:attack=20:release=250,loudnorm=I=${VOICE_REF}:TP=-1.5:LRA=7`,
    "-ar", "44100", "-ac", "2", "-b:a", "192k", out,
  ]);
  const editFile = path.join(dir, "edit.json");
  if (fs.existsSync(editFile)) {
    const edit = JSON.parse(fs.readFileSync(editFile, "utf8"));
    edit.music = { src: `${slug}/music.mp3`, volume, duck, from: path.basename(src), start };
    fs.writeFileSync(editFile, JSON.stringify(edit, null, 2));
  }
  return out;
}

function main() {
  const [cmd, slug, file, ...rest] = process.argv.slice(2);
  const flag = (n, d) => (rest.includes(n) ? Number(rest[rest.indexOf(n) + 1]) : d);
  if (cmd !== "music" || !slug || !file) {
    console.error("usage: node tools/audio.mjs music <slug> <file> [--start <sec>] [--volume 0.4] [--duck 0.2]");
    process.exit(1);
  }
  const out = music(slug, path.resolve(file), { start: flag("--start", 0), volume: flag("--volume", 0.4), duck: flag("--duck", 0.2) });
  console.log(`music → ${out} (in pauses ${flag("--volume", 0.4) * 100}%, under the voice ${flag("--duck", 0.2) * 100}%)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
