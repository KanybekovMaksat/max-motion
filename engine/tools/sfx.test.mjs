import assert from "node:assert/strict";
import test from "node:test";
import { SOUNDS, cutPoints } from "./sfx.mjs";

// 10 ms windows: 0.3 s silence, 0.2 s rising, peak, 0.4 s tail, 1 s silence
const env = [...Array(30).fill(-90), ...Array.from({ length: 20 }, (_, i) => -40 + i * 2), -2, ...Array.from({ length: 40 }, (_, i) => -4 - i), ...Array(100).fill(-90)];

test("cut starts just before the sound, keeps the peak offset and the tail", () => {
  const c = cutPoints(env);
  assert.ok(c.start >= 0.28 && c.start <= 0.36, `start ${c.start}`);
  assert.ok(Math.abs(c.start + c.peak - 0.5) < 0.011, `peak lands at ${c.start + c.peak}`);
  assert.ok(c.start + c.dur >= 0.8 && c.start + c.dur <= 1.1, `end ${c.start + c.dur}`);
});

test("max length and start offset are respected", () => {
  assert.ok(cutPoints(env, 0, 0.2).dur <= 0.23);
  assert.ok(cutPoints(env, 0.45).start >= 0.45);
});

test("every effect sound family exists in the map", () => {
  for (const n of ["whoosh-1", "whoosh-sharp", "whoosh-big", "riser-short", "hit-1", "impact-bell", "ui-1", "pop-1", "type", "counter", "notify", "toggle", "zoom", "tech", "rubber", "blur-out", "hud", "success"]) assert.ok(SOUNDS[n], n);
});
