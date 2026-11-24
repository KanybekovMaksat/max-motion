// Captions are never covered: every phrase fits the caption band, and the card slot ends above it.
// (runs with --experimental-strip-types: src/layout.ts is plain TypeScript)
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { CAPTION_GAP, CAPTION_H, CAPTION_LIFT, captionTop, fitCaption } from "../src/layout.ts";

const ZONES = JSON.parse(fs.readFileSync(new URL("../src/safe-zones.json", import.meta.url), "utf8"));
const plain = (chars) => ({ chars, em: 0.56, max: 50 });
const serif = (chars) => ({ chars, em: 0.6, max: 104 });

test("a short phrase keeps its natural sizes", () => {
  const f = fitCaption([[plain(4), plain(5), serif(7)]], 740, CAPTION_H);
  assert.equal(f.k, 1);
  assert.deepEqual(f.sizes[0], [50, 50, 104]);
});

test("long phrases shrink until they fit the caption band", () => {
  const cases = [
    [[plain(9), plain(11), plain(8)], [serif(16)]], // key word stacked on its own line
    [[plain(12), plain(14), serif(18), plain(13)]], // four long words wrapping
    [[plain(3), plain(2)], [serif(24)]],
  ];
  for (const groups of cases) {
    const f = fitCaption(groups, 700, CAPTION_H);
    assert.ok(f.height <= CAPTION_H, `height ${f.height}`);
    for (const g of f.sizes) for (const s of g) assert.ok(s >= 20, `size ${s} still readable`);
  }
});

test("a single word never overflows the width", () => {
  const f = fitCaption([[serif(30)]], 700, CAPTION_H);
  assert.ok(30 * 0.6 * f.sizes[0][0] <= 700);
});

test("for every platform the card slot and graphics end above the caption band", () => {
  for (const [name, z] of Object.entries(ZONES).filter(([, z]) => typeof z.bottom === "number")) {
    const bandTop = 1920 - z.bottom - CAPTION_LIFT - CAPTION_H;
    assert.equal(captionTop(z), bandTop - CAPTION_GAP, name);
    // the band leaves the picture most of the safe zone
    assert.ok(bandTop >= z.top + 800, `${name}: band too tall`);
  }
});
