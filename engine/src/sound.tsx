// Sound design. Every effect plays one or more layers from the library in public/sfx
// (built from a sound pack by `mm sfx`, listed in public/sfx/index.json with each sound's peak).
// Whooshes and risers are placed so their peak lands on the moment (a cut, a word landing),
// not their start; repeated effects rotate through variants so the reel never sounds looped.
import React from "react";
import { Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import type { Cap } from "./captions";
import type { Edit, Fx, Meta, Word } from "./types";

export type SfxIndex = Record<string, { dur: number; peak: number }>;

// The library and the music are levelled for a voice at -16 LUFS; a quieter voice turns them down
// by the same amount (the render then lifts the whole mix to -14 LUFS), so the voice always leads.
export const voiceGain = (meta: Meta) => Math.min(1, Math.pow(10, ((meta.lufs ?? -16) + 16) / 20));

type Layer = {
  name: string | string[]; // several = rotate per occurrence of the effect
  vol: number;
  at?: number | "mid"; // seconds after the effect starts ("mid" = middle of the effect)
  peak?: boolean; // line up the sound's peak with `at` instead of its start
  len?: (fx: Fx) => number; // cut the sound after this many seconds (typing beds)
};

const W = ["whoosh-1", "whoosh-2", "whoosh-4"];

const MAP: Partial<Record<Fx["type"], Layer[]>> = {
  behind: [{ name: W, vol: 0.5, at: 0.12, peak: true }],
  pop: [{ name: ["pop-1", "pop-2", "pop-3"], vol: 0.55, at: 0.05 }, { name: "whoosh-click", vol: 0.25, at: 0.12, peak: true }],
  halo: [{ name: "whoosh-chimes", vol: 0.45, at: 0.15, peak: true }],
  card: [{ name: ["ui-1", "ui-2", "ui-3", "ui-4"], vol: 0.5 }, { name: "pop-1", vol: 0.3, at: 0.3 }],
  orbit: [{ name: ["transform-1", "transform-2"], vol: 0.45 }, { name: "whoosh-3", vol: 0.3, at: 0.35, peak: true }],
  punch: [{ name: "zoom", vol: 0.35 }],
  broll: [{ name: "whoosh-camera", vol: 0.6, peak: true }],
  film: [{ name: "whoosh-click", vol: 0.5, at: 0.1, peak: true }, { name: "riser-short", vol: 0.25, at: 0.3, peak: true }],
  search: [{ name: "click-2", vol: 0.45 }, { name: "type", vol: 0.4, at: 0.13, len: (fx) => fx.dur * 0.6 }],
  rays: [{ name: "whoosh-chimes", vol: 0.35, at: 0.2, peak: true }],
  ribbon: [{ name: ["whoosh-3", "whoosh-4"], vol: 0.5, at: 0.25, peak: true }],
  quote: [{ name: "pop-4", vol: 0.45 }, { name: "type", vol: 0.3, at: 0.17, len: (fx) => (fx.type === "quote" ? Math.min(fx.dur - 0.3, fx.text.length / 39) : 0) }],
  shake: [{ name: ["hit-1", "hit-3", "hit-2", "hit-4"], vol: 0.6 }, { name: ["impact-2", "impact-1"], vol: 0.3 }],
  whip: [{ name: "whoosh-sharp", vol: 0.6, at: "mid", peak: true }],
  counter: [{ name: "counter", vol: 0.55, at: 0.05 }, { name: "beep-3", vol: 0.35, at: 0.85 }],
  chat: [{ name: "pop-2", vol: 0.35 }, { name: "notify", vol: 0.5, at: 0.4 }],
  progress: [{ name: "toggle", vol: 0.45 }, { name: "build-1", vol: 0.35, at: 0.2 }],
  particles: [{ name: "hud", vol: 0.4 }],
  chart: [{ name: "build-2", vol: 0.45 }, { name: "riser-short", vol: 0.3, at: 0.7, peak: true }],
  title: [
    { name: "riser-short", vol: 0.35, peak: true },
    { name: "whoosh-big", vol: 0.55, at: 0.05, peak: true },
    { name: ["impact-bell", "impact-1"], vol: 0.4, at: 0.12 },
  ],
};

const OUTLINE: Record<string, Layer> = {
  neon: { name: "tech", vol: 0.5 },
  sticker: { name: "rubber", vol: 0.5 },
  rim: { name: "blur-out", vol: 0.45 },
};

// names from older edits → the library
const ALIAS: Record<string, string> = {
  whoosh: "whoosh-1", pop: "pop-1", click: "click-1", ding: "notify", impact: "impact-1",
  swish: "whoosh-chimes", tick: "click-crispy", riser: "riser-short",
};

export const Sounds: React.FC<{ edit: Edit; index: SfxIndex; plan: Cap[]; gain: number }> = ({ edit, index, plan, gain }) => {
  const { fps } = useVideoConfig();
  const level = (edit.sfxVolume ?? 1) * gain;
  const out: React.ReactNode[] = [];
  const seen: Record<string, number> = {};
  const play = (key: string, name: string, t: number, vol: number, len?: number) => {
    const n = index[name] ? name : ALIAS[name];
    if (!n || !index[n]) return;
    const from = Math.max(0, Math.round(t * fps));
    const dur = Math.max(1, Math.round((len ?? index[n].dur + 0.1) * fps));
    out.push(
      <Sequence key={key} from={from} durationInFrames={dur} layout="none">
        <Audio src={staticFile(`sfx/${n}.mp3`)} volume={vol * level} />
      </Sequence>,
    );
  };
  const layer = (key: string, l: Layer, fx: Fx, k: number) => {
    const name = Array.isArray(l.name) ? l.name[k % l.name.length] : l.name;
    const n = index[name] ? name : ALIAS[name];
    const at = fx.at + (l.at === "mid" ? fx.dur / 2 : (l.at ?? 0));
    const t = at - (l.peak && n && index[n] ? index[n].peak : 0);
    const len = l.len?.(fx);
    if (len !== undefined && len <= 0.05) return;
    play(key, name, t, l.vol, len);
  };

  edit.fx.forEach((fx, i) => {
    if (fx.type === "sfx") return play(`${i}`, fx.name, fx.at, fx.volume ?? 0.6);
    if (edit.sfx === false) return;
    const k = (seen[fx.type] = (seen[fx.type] ?? -1) + 1);
    if (fx.type === "checklist") {
      // one tick per item as it lands (same timing as the pills), a soft chime on the last
      const step = Math.max(5, Math.min(10, Math.floor((fx.dur * fps - 10) / fx.items.length))) / fps;
      fx.items.forEach((_, j) => play(`${i}-${j}`, j % 2 ? "beep-1" : "click-crispy", fx.at + j * step + 5 / fps, 0.55));
      play(`${i}-ok`, "success", fx.at + fx.items.length * step + 0.15, 0.25);
      return;
    }
    const layers = fx.type === "outline" ? [OUTLINE[fx.style ?? "neon"]] : MAP[fx.type] ?? [];
    layers.forEach((l, j) => layer(`${i}-${j}`, l, fx, k));
  });

  // a soft whoosh when a caption word goes behind the person
  if (edit.sfx !== false)
    plan.forEach((c, i) => {
      if (!c.behind) return;
      const name = W[i % W.length];
      if (index[name]) play(`cap-${i}`, name, c.words[c.key].s - index[name].peak + 0.1, 0.25);
    });
  return <>{out}</>;
};

// Music bed: `volume` in pauses, ducks to `duck` while someone speaks (starts dipping 0.15 s before
// a phrase, comes back over 0.4 s after it), fades in at the start and out over the last second.
export const Music: React.FC<{ music: NonNullable<Edit["music"]>; words: Word[]; gain: number }> = ({ music, words, gain }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const curve = React.useMemo(() => {
    const talk = new Float32Array(durationInFrames);
    // words closer than 0.4 s count as one phrase, so the music doesn't pump between words
    let s = -1, e = -1;
    const mark = () => {
      for (let f = Math.max(0, Math.floor((s - 0.15) * fps)); f < Math.min(durationInFrames, Math.ceil(e * fps)); f++) talk[f] = 1;
    };
    for (const w of words) {
      if (s >= 0 && w.s - e < 0.4) e = w.e;
      else {
        if (s >= 0) mark();
        s = w.s;
        e = w.e;
      }
    }
    if (s >= 0) mark();
    // attack ~4 frames, release ~12 frames
    const out = new Float32Array(durationInFrames);
    let v = 0;
    for (let f = 0; f < durationInFrames; f++) {
      const look = talk[Math.min(durationInFrames - 1, f + 4)];
      v += (look - v) * (look > v ? 0.3 : 0.09);
      out[f] = v;
    }
    return out;
  }, [words, fps, durationInFrames]);
  const hi = music.volume ?? 0.4, lo = music.duck ?? 0.2;
  return (
    <Audio
      src={staticFile(music.src)}
      volume={(f) => {
        const fade = Math.min(1, f / (0.3 * fps), (durationInFrames - f) / fps);
        return Math.max(0, (hi + (lo - hi) * (curve[f] ?? 0)) * fade * gain);
      }}
    />
  );
};
