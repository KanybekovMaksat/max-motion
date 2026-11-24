// Build the sound library from a sound pack: trim each sound to its useful part, level it,
// find where its peak sits, write public/sfx/<name>.mp3 + public/sfx/index.json.
// usage: node tools/sfx.mjs <pack folder | public Yandex Disk link>
// The pack itself is not shipped with the skill (licensed sounds) — only this map of file names.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// name → file in the pack (matched by base name, any subfolder), optional start (s) and max length (s)
export const SOUNDS = {
  "whoosh-1": { file: "вуш.wav" },
  "whoosh-2": { file: "saas whoosh.wav" },
  "whoosh-3": { file: "saas whoosh 2.mp3" },
  "whoosh-4": { file: "mixkit-air-woosh-1489.wav" },
  "whoosh-big": { file: "DA - Whoosh Big - 6.mp3" },
  "whoosh-long": { file: "затяжной вуш.wav" },
  "whoosh-click": { file: "вуш с щелчком.wav" },
  "whoosh-camera": { file: "вуш с камерой.wav" },
  "whoosh-sharp": { file: "Резкие вуши.mp3", start: 2.3, max: 0.9 },
  "whoosh-chimes": { file: "small_whoosh_chimes_1.wav" },
  "riser-short": { file: "1. Riser.mp3" },
  "riser": { file: "Разгон.wav" },
  "riser-metal": { file: "SFX - Riser Metallic (Transition).m4a", max: 2.2 },
  "impact-1": { file: "Импакт.wav", max: 2 },
  "impact-2": { file: "impact eric.wav", max: 1.6 },
  "impact-bell": { file: "Импакт (колокольчик).wav", max: 2 },
  "hit-1": { file: "Wall Hit 1.wav" },
  "hit-2": { file: "Wall Hit 2.wav" },
  "hit-3": { file: "Wall Hit 3.wav" },
  "hit-4": { file: "Wall Hit 4.wav" },
  "click-1": { file: "App Click 1.wav" },
  "click-2": { file: "App Click 2.wav" },
  "click-3": { file: "App Click 8.wav" },
  "click-crispy": { file: "CRISPY CLICK.mp3" },
  "beep-1": { file: "MA_BANT_Modern_Clicks_And_Beeps_2.wav" },
  "beep-2": { file: "MA_BANT_Modern_Clicks_And_Beeps_6.wav" },
  "beep-3": { file: "MA_BANT_Modern_Clicks_And_Beeps_8.wav" },
  "ui-1": { file: "MA_Equilibrio_ModernInterface_01.wav" },
  "ui-2": { file: "MA_Equilibrio_ModernInterface_02.wav" },
  "ui-3": { file: "MA_Equilibrio_ModernInterface_03.wav" },
  "ui-4": { file: "MA_Equilibrio_ModernInterface_04.wav" },
  "build-1": { file: "MA_JoelLoopez_ActionBuild_01.wav", max: 1.2 },
  "build-2": { file: "MA_JoelLoopez_ActionBuild_02.wav", max: 1.4 },
  "pop-1": { file: "ui-pop-up-2-197887.mp3" },
  "pop-2": { file: "cartoon-bubbles-popping-gfx-sounds-3-3-00-00.mp3" },
  "pop-3": { file: "ES_Pops, Wobble, Bloop, Pops - Epidemic Sound.mp3" },
  "pop-4": { file: "bamboo.mp3" },
  "notify": { file: "notification3.mp3", max: 0.8 },
  "type": { file: "эпл печатание.mp3", max: 3 },
  "counter": { file: "счетчик.mp3" },
  "toggle": { file: "переключатель.mp3", max: 0.6 },
  "zoom": { file: "механический зум.mp3" },
  "transform-1": { file: "трансформация.mp3" },
  "transform-2": { file: "трансформация 1.mp3" },
  "rubber": { file: "резин.mp3" },
  "blur-out": { file: "блюр выход.mp3" },
  "hud": { file: "HUD Screen - 02.wav" },
  "tech": { file: "mixkit-alien-technology-button-3118.wav" },
  "success": { file: "MA_PashaStriker_BellsOfSuccess_1.wav", max: 1.6 },
};

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

// a public Yandex Disk folder → <workspace>/sfx-pack (audio files only)
async function fromYandex(link) {
  const dir = path.join(ROOT, "sfx-pack");
  const api = "https://cloud-api.yandex.net/v1/disk/public/resources";
  const list = async (p) => (await fetch(`${api}?${new URLSearchParams({ public_key: link, path: p, limit: "1000" })}`)).json();
  const pull = async (p) => {
    for (const it of (await list(p))._embedded?.items ?? []) {
      if (it.type === "dir") await pull(it.path);
      else if (/\.(wav|mp3|m4a|aif+|ogg|flac)$/i.test(it.name)) {
        const dst = path.join(dir, it.path.replace(/^\//, ""));
        if (fs.existsSync(dst)) continue;
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        fs.writeFileSync(dst, Buffer.from(await (await fetch(it.file)).arrayBuffer()));
      }
    }
  };
  await pull("/");
  return dir;
}

// loudness in 10 ms windows (dB), mono 8 kHz
function envelope(file) {
  const buf = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", "8000", "-f", "f32le", "-"], { maxBuffer: 1 << 28 });
  const a = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
  const db = [];
  for (let i = 0; i + 80 <= a.length; i += 80) {
    let s = 0;
    for (let j = 0; j < 80; j++) s += a[i + j] ** 2;
    db.push(10 * Math.log10(s / 80 + 1e-12));
  }
  return db;
}

export function cutPoints(db, start = 0, max = 2.5) {
  const from = Math.round(start * 100);
  const part = db.slice(from);
  const top = Math.max(...part);
  const on = part.findIndex((v) => v > top - 30);
  const pk = part.indexOf(top);
  let off = part.length - [...part].reverse().findIndex((v) => v > top - 34);
  off = Math.min(off + 12, on + Math.round(max * 100));
  const s = Math.max(0, on - 2);
  return { start: (from + s) / 100, dur: Math.max(0.05, (off - s) / 100), peak: Math.max(0, (pk - s) / 100), top };
}

async function main() {
  const src = process.argv[2];
  if (!src) {
    console.error("usage: npm run sfx -- <pack folder | public Yandex Disk link>");
    process.exit(1);
  }
  const pack = /^https?:/.test(src) ? await fromYandex(src) : path.resolve(src);
  const files = walk(pack);
  const out = path.join(ROOT, "public", "sfx");
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const index = {};
  for (const [name, s] of Object.entries(SOUNDS)) {
    // macOS / Yandex names may come decomposed ("й" = "и" + breve), compare in NFC
    const file = files.find((f) => path.basename(f).normalize("NFC") === s.file.normalize("NFC"));
    if (!file) {
      console.warn(`  skip ${name}: "${s.file}" not in the pack`);
      continue;
    }
    const c = cutPoints(envelope(file), s.start ?? 0, s.max ?? 2.5);
    // loudest 10 ms at -9 dB RMS (same punch for a click and a whoosh), limiter catches the peaks,
    // short fades so nothing clicks
    const gain = -9 - c.top;
    const fadeOut = Math.min(0.25, c.dur * 0.4);
    execFileSync("ffmpeg", [
      "-v", "error", "-y", "-ss", String(c.start), "-t", String(c.dur), "-i", file,
      "-af", `volume=${gain.toFixed(1)}dB,alimiter=limit=0.89:level=false,afade=t=in:d=0.005,afade=t=out:st=${(c.dur - fadeOut).toFixed(3)}:d=${fadeOut.toFixed(3)}`,
      "-ac", "2", "-ar", "44100", "-b:a", "192k", path.join(out, `${name}.mp3`),
    ]);
    index[name] = { dur: +c.dur.toFixed(2), peak: +c.peak.toFixed(2) };
  }
  fs.writeFileSync(path.join(out, "index.json"), JSON.stringify(index, null, 1));
  console.log(`${Object.keys(index).length} sounds → ${out}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
