import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { keyWords, planEdit } from "./plan.mjs";
import { cropFor, facePx, parseWords } from "./prep.mjs";
import { LOOKS, contentKind, pickLook } from "./looks.mjs";

const W = (w, s, e) => ({ w, s, e });
const words = [
  W("так", 0, 0.2), W("скажу", 0.3, 0.6), W("программирование", 0.7, 1.4), W("это", 1.5, 1.6),
  W("будущее", 1.7, 2.2), W("для", 2.3, 2.4), W("ребёнка", 2.9, 3.4), W("робототехника", 4.2, 5.0), W("навсегда.", 5.6, 6.2),
];

test("keyWords skips stopwords and keeps beats at least 1.1s apart", () => {
  const k = keyWords(words);
  assert.ok(k.every((w) => !["так", "скажу", "это", "для"].includes(w.w)));
  for (let i = 1; i < k.length; i++) assert.ok(k[i].s - k[i - 1].s >= 1.1);
  assert.equal(k[0].w, "программирование");
});

test("planEdit: hook = halo + behind on the first beat, card on the last, effects sorted and inside the clip", () => {
  const e = planEdit({ slug: "t", words, duration: 6.3, images: ["assets/a.jpg", "assets/b.jpg"] });
  const first = e.fx.filter((f) => f.at === e.fx.find((x) => x.type === "halo").at).map((f) => f.type);
  assert.ok(first.includes("behind") && first.includes("punch") && first.includes("outline"));
  assert.ok(e.fx.some((f) => f.type === "card"));
  for (let i = 1; i < e.fx.length; i++) assert.ok(e.fx[i].at >= e.fx[i - 1].at);
  for (const f of e.fx) assert.ok(f.at >= 0 && f.at + f.dur <= 6.3 + 0.01, `${f.type} overruns`);
  assert.equal(e.fx.find((f) => f.type === "behind").text, "программирование");
});

test("planEdit without speech gives an empty but valid edit", () => {
  const e = planEdit({ slug: "t", words: [], duration: 3 });
  assert.deepEqual(e.fx, []);
  assert.equal(e.captions, true);
});

test("parseWords glues split tokens and trailing punctuation, trims leading silence", () => {
  const j = { transcription: [
    { text: " скаж", offsets: { from: 0, to: 800 } },
    { text: "у", offsets: { from: 800, to: 990 } },
    { text: " эффекты", offsets: { from: 1000, to: 1400 } },
    { text: ".", offsets: { from: 1400, to: 1400 } },
  ] };
  const w = parseWords(j);
  assert.deepEqual(w.map((x) => x.w), ["скажу", "эффекты."]);
  assert.equal(w[0].e, 0.99);
});

test("cropFor keeps the face inside a 9:16 window", () => {
  const c = cropFor(2560, 1440, { cx: 0.9, cy: 0.4, w: 0.1, h: 0.1 });
  assert.equal(c.h, 1440);
  assert.ok(Math.abs(c.w / c.h - 9 / 16) < 0.01);
  assert.ok(c.x + c.w <= 2560 && c.x >= 0);
  const f = facePx({ cx: 0.9, cy: 0.4, w: 0.1, h: 0.1 }, { width: 2560, height: 1440 }, c);
  assert.ok(f.x > 0 && f.x < 1080);
});

test("keepSegments merges close words and drops long pauses", async () => {
  const { keepSegments } = await import("./prep.mjs");
  const segs = keepSegments([W("a", 0.5, 0.9), W("b", 1.0, 1.3), W("c", 2.5, 2.9)], 4);
  assert.equal(segs.length, 2);
  assert.deepEqual(segs[0], [0.42, 1.42]);
  assert.ok(segs[1][0] > 2.3 && segs[1][1] < 3.1);
});

test("planEdit cycles through title cards, sticker outlines and ribbons", () => {
  const LETTERS = "абвгдежзиклмнопрст";
  const many = Array.from({ length: 14 }, (_, i) => W(`слово${LETTERS[i]}`, i * 1.3, i * 1.3 + 0.5));
  const e = planEdit({ slug: "t", words: many, duration: 19, images: ["assets/a.jpg"], look: "brand" });
  const types = new Set(e.fx.map((f) => f.type));
  for (const t of ["title", "outline", "ribbon", "whip", "pop", "orbit"]) assert.ok(types.has(t), `no ${t}`);
  assert.ok(e.fx.some((f) => f.type === "outline" && f.style === "sticker"));
});

test("pickLook maps the goal of the video to a look", () => {
  assert.equal(pickLook("продать курс программирования"), "sell");
  assert.equal(pickLook("подкаст с экспертом про ИИ"), "podcast");
  assert.equal(pickLook("новости для подростков, тренд"), "hype");
  assert.equal(pickLook("объяснить родителям, как проходит урок"), "calm");
  assert.equal(pickLook("личный бренд основателя"), "brand");
  assert.equal(pickLook("премиум квартира"), "luxury");
  assert.equal(pickLook(""), "sell");
});

test("contentKind: numbers become counters, questions chats, enumerations checklists", () => {
  const ws = [W("у", 0, 0.1), W("нас", 0.1, 0.3), W("1500", 0.3, 0.8), W("выпускников.", 0.8, 1.2), W("Почему", 1.3, 1.6), W("так", 1.6, 1.8), W("дорого?", 1.8, 2.2), W("Во-первых", 2.4, 2.9)];
  assert.equal(contentKind(ws, 2), "counter");
  assert.equal(contentKind(ws, 4), "chat");
  assert.equal(contentKind(ws, 7), "checklist");
  assert.equal(contentKind(ws, 3), null);
});

test("every look plans a valid edit with its own caption style and colour", () => {
  const many = Array.from({ length: 12 }, (_, i) => W(`слово${"абвгдежзиклм"[i]}`, i * 1.5, i * 1.5 + 0.5));
  for (const look of Object.keys(LOOKS)) {
    const e = planEdit({ slug: "t", words: many, duration: 18, images: [], look });
    assert.equal(e.captionStyle, LOOKS[look].captionStyle);
    assert.equal(e.accent, LOOKS[look].accent);
    assert.ok(e.fx.length > 5, look);
    // no photos given → nothing that needs photos
    assert.ok(!e.fx.some((f) => ["pop", "film", "broll"].includes(f.type)), look);
    if (!LOOKS[look].shakeEvery) assert.ok(!e.fx.some((f) => f.type === "shake"), `${look} must not shake`);
  }
});

test("plan keeps the reel inside the safe zone of every platform by default", () => {
  const e = planEdit({ slug: "t", words, duration: 6 });
  assert.equal(e.platform, "all");
  assert.equal(planEdit({ slug: "t", words, duration: 6, platform: "tiktok" }).platform, "tiktok");
});

test("safe zones: the union covers each platform and leaves a usable box", () => {
  const Z = JSON.parse(fs.readFileSync(new URL("../src/safe-zones.json", import.meta.url), "utf8"));
  for (const p of ["reels", "tiktok", "shorts"]) {
    for (const k of ["top", "bottom", "left", "right"]) assert.ok(Z.all[k] >= Z[p][k], `all.${k} < ${p}.${k}`);
    assert.ok(Z.all.rail.x <= Z[p].rail.x);
  }
  assert.ok(1080 - Z.all.left - Z.all.right >= 800);
  assert.ok(1920 - Z.all.top - Z.all.bottom >= 1150);
});
