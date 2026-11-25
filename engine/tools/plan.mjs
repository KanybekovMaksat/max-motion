// words.json -> first-draft edit.json. The rhythm of the references: one effect per stressed
// word every ~1.2s, a giant word behind the head on most of them, a punch on every one,
// a UI card on the last beat. Open public/<slug>/edit.json afterwards and tune by hand.
// usage: npm run plan -- <slug> [--look sell|brand|podcast|hype|calm|luxury | --goal "продать курс родителям"] [--accent #hex] [--logo assets/logo.svg] [--force]
//   accent and logo default to <workspace>/public/brand.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LOOKS, contentKind, numberIn, pickLook } from "./looks.mjs";
import { stickerAt } from "./stickers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const STOP = new Set(
  `и в во не что он на я с со как а то все она так его но да ты к у же вы за бы по только ее мне было вот от меня еще нет о из ему теперь когда даже ну вдруг ли если уже или ни быть был него до вас нибудь опять уж вам ведь там потом себя ничего ей может они тут где есть надо ней для мы тебя их чем была сам чтоб без будто чего раз тоже себе под будет ж тогда кто этот того потому этого какой совсем ним здесь этом один почти мой тем чтобы нее сейчас были куда зачем всех никогда можно при наконец два об другой хоть после над больше тот через эти нас про всего них какая много разве три эту моя впрочем хорошо свою этой перед иногда лучше чуть том нельзя такой им более всегда конечно всю между это эта
the a an and or but if then so to of in on at by for with from up out is are was were be been being it its this that these those i you he she we they me my your our their do does did have has had not no yes just very really can will would should could what which who whom how when where why all any some more most other such than too also into over about like get got go going gonna`.split(/\s+/),
);

const clean = (w) => w.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "");

export function keyWords(words, gap = 1.1, strict = true) {
  const picked = [];
  for (let i = 0; i < words.length; i++) {
    const c = clean(words[i].w);
    if (c.length < 4 || (strict && STOP.has(c))) continue;
    const last = picked[picked.length - 1];
    if (last && words[i].s - last.s < gap) {
      // keep the longer word of two close ones
      if (c.length > clean(last.w).length) picked[picked.length - 1] = { ...words[i], i };
      continue;
    }
    picked.push({ ...words[i], i });
  }
  return picked;
}

const r2 = (n) => Math.round(n * 100) / 100;
const bare = (w) => w.replace(/[.,!?…:;«»"]+/g, "");

export function planEdit({ slug, words, duration, images = [], icons = ["instagram", "tiktok", "youtube", "telegram"], look = "sell", accent, logo, platform = "all" }) {
  const L = LOOKS[look] ?? LOOKS.sell;
  // filler-heavy speech gives too few beats; then any 4+ letter word may carry an effect
  let keys = keyWords(words, L.gap);
  if (keys.length < Math.floor(duration / (L.gap * 1.8))) keys = keyWords(words, L.gap, false);
  const fx = [];
  const img = (k, n) => Array.from({ length: n }, (_, j) => images[(k * n + j) % Math.max(1, images.length)]).filter(Boolean);
  const needsImages = new Set(["pop", "film", "broll"]);
  let titles = 0, stickers = 0;
  const shown = []; // icons already used, so the same one doesn't come back within ~8 s
  keys.forEach((w, k) => {
    const next = keys[k + 1]?.s ?? duration;
    const at = r2(Math.max(0, w.s - 0.08));
    const dur = r2(Math.max(0.7, Math.min(2.2, next - at - 0.05)));
    const word = clean(w.w);
    const prev = words[w.i - 1];
    const kicker = prev && w.s - prev.e < 0.6 ? bare(prev.w).toLowerCase() : undefined;
    // white-metal words vanish on light walls: bright looks colour them with the accent
    const tint = L.grade.brightness >= 1 && L.behindFont !== "sans" ? { color: accent ?? L.accent } : {};
    const behind = (extra = {}) => fx.push({ type: "behind", at, dur, text: word, font: L.behindFont, ...tint, ...(kicker ? { kicker } : {}), ...extra });
    // camera on every beat: a 3D shake every Nth one (if the look shakes at all), a zoom punch otherwise
    if (L.shakeEvery && k % L.shakeEvery === L.shakeEvery - 1) fx.push({ type: "shake", at, dur: r2(Math.min(dur, 0.7)) });
    else fx.push({ type: "punch", at, dur: r2(Math.min(dur, 0.9)), scale: L.shakeEvery ? (k % 2 ? 1.1 : 1.16) : 1.08 });
    if (k === 0) {
      // the hook: outline + the first word, a halo when the look is loud enough
      if (L.hookHalo ?? L.shakeEvery) fx.push({ type: "halo", at, dur });
      fx.push({ type: "outline", at, dur, style: L.hookOutline });
      behind();
      return;
    }
    if (k === keys.length - 1 && keys.length > 2) {
      behind();
      if (L.outro === "behind") return;
      fx.push({ type: "card", at: r2(at + 0.15), dur: r2(Math.max(0.6, dur - 0.15)), title: bare(w.w), badge: "✓", ...(images[0] ? { image: images[0] } : {}) });
      return;
    }
    // what the words say beats the look's default cycle
    let kind = contentKind(words, w.i);
    if (!kind || L.avoid?.includes(kind)) kind = L.cycle[k % L.cycle.length];
    if (needsImages.has(kind) && !images.length) kind = "behind";
    if (kind === "title" && L.titles != null && titles >= L.titles) kind = "sticker";
    // a sticker needs a thing the speaker names (idea, team, money…); otherwise the word goes behind
    const st = kind === "sticker" ? stickerAt(words, w.i, 3, new Set(shown.filter((x) => w.s - x.at < 8).map((x) => x.icon))) : null;
    if (kind === "sticker" && !st) kind = "behind";
    const phrase = (n) => words.slice(w.i, w.i + n).map((x) => bare(x.w)).join(" ");
    if (kind === "behind") behind();
    else if (kind === "sticker") {
      shown.push({ icon: st.icon, at: w.s });
      // pops on the word itself, sides alternate (the engine still moves it off any face), every 3rd one clicks
      const sAt = r2(Math.max(0, st.at - 0.05));
      fx.push({ type: "sticker", at: sAt, dur: r2(Math.max(1.2, Math.min(2.2, next - sAt + 0.4))), src: st.src, pos: stickers % 2 ? "right" : "left", ...(stickers % 3 === 0 ? { sound: true } : {}) });
      stickers++;
    }
    else if (kind === "pop") {
      fx.push({ type: "pop", at, dur, images: img(k, 3) });
      behind({ kicker: undefined });
      // photos around a sticker-outlined person read like a collage
      fx.push({ type: "outline", at, dur, style: "sticker" });
    } else if (kind === "title") {
      // перебивка: the speaker drops out for one beat, a whip leads into it
      fx.push({ type: "whip", at: r2(Math.max(0, at - 0.08)), dur: 0.2 });
      fx.push({ type: "title", at, dur: r2(Math.min(dur, 1.0)), text: word, ...(kicker ? { kicker } : {}), ...(logo ? { logo } : {}) });
      titles++;
    } else if (kind === "ribbon") {
      fx.push({ type: "ribbon", at, dur });
      behind();
    } else if (kind === "halo" || kind === "rays") {
      fx.push({ type: kind, at, dur });
      behind();
    } else if (kind === "orbit") fx.push({ type: "orbit", at, dur, icons });
    else if (kind === "film") fx.push({ type: "film", at, dur, text: word, images: img(k, 4) });
    else if (kind === "search") fx.push({ type: "search", at, dur, text: phrase(4) });
    else if (kind === "quote") fx.push({ type: "quote", at, dur, text: phrase(5) });
    else if (kind === "card") fx.push({ type: "card", at, dur, title: bare(w.w), badge: "✓", ...(images[0] ? { image: images[k % images.length] } : {}) });
    else if (kind === "progress") fx.push({ type: "progress", at, dur, title: bare(w.w) });
    else if (kind === "counter") fx.push({ type: "counter", at, dur, label: phrase(3), to: numberIn(w.w) });
    else if (kind === "chat") fx.push({ type: "chat", at, dur, text: phrase(5) });
    else if (kind === "chart") fx.push({ type: "chart", at, dur: r2(Math.min(dur, 1.2)), label: bare(w.w) });
    else if (kind === "broll") {
      fx.push({ type: "whip", at: r2(Math.max(0, at - 0.1)), dur: 0.22 });
      fx.push({ type: "broll", at, dur: r2(Math.min(dur, 1.4)), src: images[k % images.length], text: bare(w.w) });
    } else if (kind === "particles") {
      fx.push({ type: "particles", at, dur, shape: "globe" });
      behind({ font: "serif" });
    } else if (kind === "checklist") fx.push({ type: "checklist", at, dur, items: words.slice(w.i, w.i + 3).map((x) => bare(x.w)) });
  });
  if (keys.length && L.backdrop) fx.unshift({ type: L.backdrop, at: 0, dur: r2(duration) });
  return {
    slug,
    look,
    accent: accent ?? L.accent,
    captions: true,
    captionStyle: L.captionStyle,
    platform,
    sfx: true,
    sfxVolume: L.sfx,
    grade: L.grade,
    fx: fx.sort((a, b) => a.at - b.at),
  };
}

function main() {
  const argv = process.argv.slice(2);
  const slug = argv[0];
  const flag = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
  if (!slug) {
    console.error('usage: npm run plan -- <slug> [--look sell|brand|podcast|hype|calm|luxury | --goal "..."] [--accent #hex] [--logo assets/logo.svg] [--platform reels|tiktok|shorts|all] [--force]');
    process.exit(1);
  }
  const dir = path.join(ROOT, "public", slug);
  const file = path.join(dir, "edit.json");
  if (fs.existsSync(file) && !argv.includes("--force")) {
    console.error(`${file} exists — hand edits would be lost. Pass --force to overwrite.`);
    process.exit(1);
  }
  const words = JSON.parse(fs.readFileSync(path.join(dir, "words.json"), "utf8"));
  const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
  const adir = path.join(ROOT, "public", "assets");
  const images = fs.existsSync(adir) ? fs.readdirSync(adir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort().map((f) => `assets/${f}`) : [];
  const look = flag("--look", null) ?? pickLook(flag("--goal", ""));
  if (!LOOKS[look]) throw new Error(`unknown look "${look}" — ${Object.keys(LOOKS).join(", ")}`);
  // the user's brand, saved once in <workspace>/public/brand.json: { "accent": "#hex", "logo": "assets/logo.svg" }
  const bfile = path.join(ROOT, "public", "brand.json");
  const brand = fs.existsSync(bfile) ? JSON.parse(fs.readFileSync(bfile, "utf8")) : {};
  const edit = planEdit({ slug, words, duration: meta.duration, images, look, accent: flag("--accent", brand.accent), logo: flag("--logo", brand.logo), platform: flag("--platform", "all") });
  if (!["reels", "tiktok", "shorts", "all"].includes(edit.platform)) throw new Error(`unknown platform "${edit.platform}" — reels, tiktok, shorts or all`);
  fs.writeFileSync(file, JSON.stringify(edit, null, 2));
  console.log(`edit.json: look "${look}" (${LOOKS[look].label}), ${edit.fx.length} effects`);
  for (const f of edit.fx) console.log(`  ${f.at.toFixed(2)}s  ${f.type.padEnd(9)} ${f.text ?? f.title ?? ""}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
