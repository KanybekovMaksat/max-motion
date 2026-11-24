import { Easing, interpolate, spring } from "remotion";

export const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const easeIn = Easing.bezier(0.55, 0, 1, 0.45);

// 0→1 enter and 1→0 exit envelope for an effect living [start, start+len) in frames.
export function envelope(frame: number, start: number, len: number, inF = 8, outF = 8) {
  const t = frame - start;
  const a = interpolate(t, [0, inF], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const b = interpolate(t, [len - outF, len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeIn });
  return Math.min(a, b);
}

export function pop(frame: number, fps: number, start: number, damping = 13, stiffness = 170) {
  return spring({ frame: frame - start, fps, config: { damping, stiffness, mass: 0.7 } });
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
