// Layout rules that keep graphics off the captions. Pure math, no React, so the tests can run it.
//
// The caption band: captions sit on the bottom of the safe zone (+ CAPTION_LIFT) and never grow
// taller than CAPTION_H (long phrases shrink to fit, `fitCaption`). Nothing readable may enter the
// band — cards, titles, charts, photos and b-roll text all end above `captionTop`, and the captions
// are drawn over every layer, so a graphic can never cover them.
export const CAPTION_LIFT = 40;
export const CAPTION_H = 230;
export const CAPTION_GAP = 24;

// y (px from the top of a 1920 frame) where graphics must end; `bottom` = the safe zone's bottom inset
export const captionTop = (zone: { bottom: number }, captions = true) =>
  1920 - zone.bottom - (captions ? CAPTION_LIFT + CAPTION_H + CAPTION_GAP : CAPTION_LIFT);

// Caption fitting: the size of every word of a phrase so the whole phrase fits the caption band.

// one word: its length, glyph width per em of its font, and the size it would like to have
export type Item = { chars: number; em: number; max: number };

export const LINE = 1.08; // line height, × the biggest size in the line
export const GAP_X = 14; // space between words
export const STACK_GAP = -8; // between stacked lines

const widthOf = (it: Item, size: number) => Math.max(3, it.chars) * it.em * size;

// greedy wrap of one group of words at the given sizes → line heights
function wrap(items: Item[], sizes: number[], width: number) {
  const lines: number[] = [];
  let used = 0, tall = 0;
  items.forEach((it, i) => {
    const w = widthOf(it, sizes[i]);
    if (used > 0 && used + GAP_X + w > width) {
      lines.push(tall * LINE);
      used = 0;
      tall = 0;
    }
    used += (used > 0 ? GAP_X : 0) + w;
    tall = Math.max(tall, sizes[i]);
  });
  if (used > 0) lines.push(tall * LINE);
  return lines;
}

// groups = lines the layout forces (e.g. the key word dropped to its own line); each group wraps
// inside `width`. Every word is first capped so it alone fits the width, then the whole phrase
// shrinks evenly until it is no taller than `maxH`.
export function fitCaption(groups: Item[][], width: number, maxH: number) {
  const base = groups.map((g) => g.map((it) => Math.min(it.max, Math.floor(width / (Math.max(3, it.chars) * it.em)))));
  const measure = (k: number) => {
    const sizes = base.map((g) => g.map((s) => Math.round(s * k)));
    const lines = groups.flatMap((g, i) => wrap(g, sizes[i], width));
    return { sizes, height: lines.reduce((a, b) => a + b, 0) + STACK_GAP * Math.max(0, groups.filter((g) => g.length).length - 1) };
  };
  let k = 1;
  let m = measure(k);
  for (let i = 0; i < 20 && m.height > maxH; i++) {
    k *= 0.94;
    m = measure(k);
  }
  return { ...m, k };
}
