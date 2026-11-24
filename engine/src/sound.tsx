// Sound design. Sound is an accent, not a decoration: a sound plays only where the reel changes
// state and the viewer must register it — a title card, a key number, a message arriving, a
// section cut, the music drop, the final ask. Outlines, halos, orbits, punches, shakes, rays,
// caption words and checklist ticks are silent unless an effect says `sound: true`.
// One meaning = one sound for the whole reel (no rotating variants), and a scheduler keeps the
// density down: at most 4 cues in any 10 s, at least 1.2 s apart, higher priority wins.
// The library is public/sfx (built by `mm sfx`, index.json has each sound's peak); whooshes and
// risers are placed so their peak lands on the moment, not their start.
import React from "react";
import { Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import type { Edit, Fx, Meta, Word } from "./types";

export type SfxIndex = Record<string, { dur: number; peak: number }>;

// The library and the music are levelled for a voice at -16 LUFS; a quieter voice turns them down
// by the same amount (the render then lifts the whole mix to -14 LUFS), so the voice always leads.
export const voiceGain = (meta: Meta) => Math.min(1, Math.pow(10, ((meta.lufs ?? -16) + 16) / 20));

type Layer = {
  name: string;
  vol: number;
  at?: number | "mid" | "end"; // seconds after the effect starts, its middle or its end
  peak?: boolean; // line up the sound's peak with `at` instead of its start
};
// prio: 0 = structure (title card, drop, CTA) … 3 = section cuts; `auto` = plays without being asked
type Rule = { layers: Layer[]; prio: number; auto: (fx: Fx) => boolean };

const yes = () => true;
const no = () => false;

const RULES: Partial<Record<Fx["type"], Rule>> = {
  // structure
  title: { prio: 0, auto: yes, layers: [{ name: "whoosh-big", vol: 0.5, peak: true }, { name: "impact-2", vol: 0.35 }] },
  // meaning: numbers, things that arrive, the offer
  counter: { prio: 1, auto: yes, layers: [{ name: "counter", vol: 0.4 }] },
  chart: { prio: 1, auto: yes, layers: [{ name: "riser-short", vol: 0.35, at: "end", peak: true }] },
  card: { prio: 1, auto: (fx) => fx.type === "card" && !!fx.accent, layers: [{ name: "pop-1", vol: 0.4 }] },
  chat: { prio: 2, auto: yes, layers: [{ name: "notify", vol: 0.45, at: 0.4 }] }, // when the message lands, not the typing dots
  // cuts
  whip: { prio: 3, auto: (fx) => fx.type === "whip" && !!fx.section, layers: [{ name: "whoosh-1", vol: 0.4, at: "mid", peak: true }] },
  broll: { prio: 3, auto: yes, layers: [{ name: "whoosh-camera", vol: 0.45, peak: true }] },
  // decoration — silent unless the effect has `sound: true`
  behind: { prio: 4, auto: no, layers: [{ name: "whoosh-1", vol: 0.35, at: 0.12, peak: true }] },
  pop: { prio: 4, auto: no, layers: [{ name: "pop-1", vol: 0.4 }] },
  halo: { prio: 4, auto: no, layers: [{ name: "whoosh-chimes", vol: 0.35, at: 0.15, peak: true }] },
  orbit: { prio: 4, auto: no, layers: [{ name: "transform-1", vol: 0.35 }] },
  punch: { prio: 4, auto: no, layers: [{ name: "zoom", vol: 0.3 }] },
  film: { prio: 4, auto: no, layers: [{ name: "whoosh-click", vol: 0.4, at: 0.1, peak: true }] },
  search: { prio: 4, auto: no, layers: [{ name: "click-2", vol: 0.4 }] },
  rays: { prio: 4, auto: no, layers: [{ name: "whoosh-chimes", vol: 0.3, at: 0.2, peak: true }] },
  ribbon: { prio: 4, auto: no, layers: [{ name: "whoosh-3", vol: 0.35, at: 0.25, peak: true }] },
  quote: { prio: 4, auto: no, layers: [{ name: "pop-4", vol: 0.35 }] },
  shake: { prio: 4, auto: no, layers: [{ name: "hit-3", vol: 0.45 }] },
  progress: { prio: 4, auto: no, layers: [{ name: "toggle", vol: 0.35 }] },
  particles: { prio: 4, auto: no, layers: [{ name: "hud", vol: 0.3 }] },
  checklist: { prio: 4, auto: no, layers: [{ name: "click-crispy", vol: 0.4, at: "end" }] },
  outline: { prio: 4, auto: no, layers: [{ name: "tech", vol: 0.35 }] },
};

// names from older edits → the library
const ALIAS: Record<string, string> = {
  whoosh: "whoosh-1", pop: "pop-1", click: "click-1", ding: "notify", impact: "impact-1",
  swish: "whoosh-chimes", tick: "click-crispy", riser: "riser-short",
};

export const BUDGET = { per10s: 4, gap: 1.2 };

type Cue = { key: string; t: number; prio: number; type: string; play: { name: string; at: number; vol: number }[] };

// Which effects get a sound: hand-placed `sfx` cues always play; automatic ones are added by
// priority while they fit the budget (an identical sound on the same effect type within 1 s,
// like two gift cards in a row, counts as one gesture).
export function cueSheet(edit: Edit, index: SfxIndex): Cue[] {
  const has = (n: string) => (index[n] ? n : ALIAS[n] && index[ALIAS[n]] ? ALIAS[n] : null);
  const manual: Cue[] = [];
  const auto: Cue[] = [];
  edit.fx.forEach((fx, i) => {
    if (fx.type === "sfx") {
      const n = has(fx.name);
      if (!n) return;
      const at = fx.at - (fx.peak ? index[n].peak : 0);
      manual.push({ key: `${i}`, t: fx.at, prio: -1, type: "sfx", play: [{ name: n, at, vol: fx.volume ?? 0.5 }] });
      return;
    }
    const rule = RULES[fx.type];
    if (!rule || fx.sound === false || edit.sfx === false) return;
    if (!(fx.sound === true || rule.auto(fx))) return;
    const moment = (l: Layer) => fx.at + (l.at === "mid" ? fx.dur / 2 : l.at === "end" ? fx.dur : (l.at ?? 0));
    const play = rule.layers.flatMap((l) => {
      const n = has(l.name);
      return n ? [{ name: n, at: moment(l) - (l.peak ? index[n].peak : 0), vol: l.vol }] : [];
    });
    if (play.length) auto.push({ key: `${i}`, t: moment(rule.layers[0]), prio: fx.sound === true ? 0.5 : rule.prio, type: fx.type, play });
  });
  const kept: Cue[] = [...manual];
  for (const c of auto.sort((a, b) => a.prio - b.prio || a.t - b.t)) {
    const pair = (k: Cue) => k.type === c.type && k.play[0].name === c.play[0].name && Math.abs(k.t - c.t) < 1;
    const near = kept.some((k) => Math.abs(k.t - c.t) < BUDGET.gap && !pair(k));
    // with this cue added, does any 10 s window hold more than the budget?
    const ts = [...kept.filter((k) => !pair(k)).map((k) => k.t), c.t];
    const crowded = ts.some((w) => ts.filter((x) => x >= w && x < w + 10).length > BUDGET.per10s);
    if (!near && !crowded) kept.push(c);
  }
  return kept.sort((a, b) => a.t - b.t);
}

export const Sounds: React.FC<{ edit: Edit; index: SfxIndex; gain: number }> = ({ edit, index, gain }) => {
  const { fps } = useVideoConfig();
  const level = (edit.sfxVolume ?? 1) * gain;
  return (
    <>
      {cueSheet(edit, index).flatMap((c) =>
        c.play.map((p, j) => (
          <Sequence key={`${c.key}-${j}`} from={Math.max(0, Math.round(p.at * fps))} durationInFrames={Math.max(1, Math.round((index[p.name].dur + 0.1) * fps))} layout="none">
            <Audio src={staticFile(`sfx/${p.name}.mp3`)} volume={p.vol * level} />
          </Sequence>
        )),
      )}
    </>
  );
};

// Music bed: `volume` in pauses, ducks to `duck` while someone speaks (starts dipping 0.15 s before
// a phrase, comes back over 0.4 s after it), fades in at the start and out at the end. From `drop`
// (the chorus) the voice-level becomes `dropDuck`; `dips` pull the bed down to a level for a moment
// (a breath before the call to action).
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
  const hi = music.volume ?? 0.4;
  // 0→1 ramp over `r` seconds after time `at`
  const ramp = (f: number, at: number, r: number) => Math.min(1, Math.max(0, (f / fps - at) / r));
  return (
    <Audio
      src={staticFile(music.src)}
      volume={(f) => {
        const lo = music.drop !== undefined && music.dropDuck !== undefined
          ? (music.duck ?? 0.2) + (music.dropDuck - (music.duck ?? 0.2)) * ramp(f, music.drop, 0.2)
          : music.duck ?? 0.2;
        let v = hi + (lo - hi) * (curve[f] ?? 0);
        for (const d of music.dips ?? []) {
          // 0.1 s in, 0.15 s out
          const k = Math.min(ramp(f, d.from - 0.1, 0.1), 1 - ramp(f, d.to, 0.15));
          v = v + (d.level - v) * Math.max(0, k);
        }
        const fade = Math.min(1, f / (0.3 * fps), (durationInFrames - f) / ((music.fadeOut ?? 1) * fps));
        return Math.max(0, v * fade * gain);
      }}
    />
  );
};
