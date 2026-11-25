import React, { useMemo } from "react";
import { AbsoluteFill, CalculateMetadataFunction, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { SANS } from "./fonts";
import { Backlight, Behind, Broll, Card, Film, Grain, Halo, Orbit, Pop, Quote, Rays, Ribbon, Search, Sticker, stickerSpot, type Spot } from "./fx";
import { Chart, Chat, Checklist, CleanCaptions, Counter, Particles, Progress, SerifCaptions, Title, WordCaptions } from "./fx2";
import { CaptionBack, MixCaptions, captionPlan } from "./captions";
import { Music, Sounds, voiceGain, type SfxIndex } from "./sound";
import { SafeOverlay, SafeProvider, useKeepOut, useSafe, zoneOf, type Platform } from "./safe";
import { envelope, pop } from "./time";
import type { Edit, Face, Fx, Head, Meta, Word } from "./types";

// `safe` draws the app UI of that platform over the video (preview only, never in the final render)
export type ProEditData = { slug: string; editFile?: string; safe?: Platform; meta?: Meta; edit?: Edit; words?: Word[]; track?: Head[]; faces?: (Face | null)[]; sfx?: SfxIndex };

export const calcProEdit: CalculateMetadataFunction<ProEditData> = async ({ props }) => {
  const get = async <T,>(f: string): Promise<T> => (await fetch(staticFile(`${props.slug}/${f}`))).json();
  const [meta, edit, words, track] = await Promise.all([get<Meta>("meta.json"), get<Edit>(props.editFile ?? "edit.json"), get<Word[]>("words.json"), get<Head[]>("track.json")]);
  // the sound library is built by `mm sfx`; without it the reel renders silent fx
  const sfx = await fetch(staticFile("sfx/index.json")).then((r) => (r.ok ? (r.json() as Promise<SfxIndex>) : {})).catch(() => ({}));
  // per-frame face boxes (clips prepped before faces.json existed fall back to the head track)
  const faces = await fetch(staticFile(`${props.slug}/faces.json`)).then((r) => (r.ok ? (r.json() as Promise<(Face | null)[]>) : [])).catch(() => []);
  return { durationInFrames: Math.floor(meta.duration * meta.fps), fps: meta.fps, width: meta.width, height: meta.height, props: { ...props, meta, edit, words, track, faces, sfx } };
};

// Layers, bottom → top:  room  ·  back fx  ·  person cutout  ·  front fx  ·  cutaways  ·  vignette  ·  captions
const BACK = new Set<Fx["type"]>(["backlight", "rays", "halo", "behind", "pop", "film", "particles"]);
const FRONT = new Set<Fx["type"]>(["card", "search", "quote", "counter", "checklist", "chat", "progress"]);
const OVER = new Set<Fx["type"]>(["broll", "chart", "title"]);
// these render twice: once under the person, once over
const BOTH = new Set<Fx["type"]>(["orbit", "ribbon"]);

type FxProps = { face: Meta["face"]; accent: string; len: number; head: (f: number) => Head; faceAt: (f: number) => Face; spot?: Spot };

function render(fx: Fx, props: FxProps, side: "back" | "front") {
  switch (fx.type) {
    case "behind": return <Behind fx={fx} {...props} />;
    case "pop": return <Pop fx={fx} {...props} />;
    case "sticker": return <Sticker fx={fx} {...props} />;
    case "halo": return <Halo fx={fx} {...props} />;
    case "card": return <Card fx={fx} {...props} />;
    case "orbit": return <Orbit fx={fx} {...props} side={side} />;
    case "backlight": return <Backlight fx={fx} {...props} />;
    case "rays": return <Rays fx={fx} {...props} />;
    case "film": return <Film fx={fx} {...props} />;
    case "search": return <Search fx={fx} {...props} />;
    case "broll": return <Broll fx={fx} {...props} />;
    case "ribbon": return <Ribbon fx={fx} {...props} side={side} />;
    case "quote": return <Quote fx={fx} {...props} />;
    case "counter": return <Counter fx={fx} {...props} />;
    case "checklist": return <Checklist fx={fx} {...props} />;
    case "chat": return <Chat fx={fx} {...props} />;
    case "progress": return <Progress fx={fx} {...props} />;
    case "particles": return <Particles fx={fx} {...props} />;
    case "chart": return <Chart fx={fx} {...props} />;
    case "title": return <Title fx={fx} {...props} />;
    default: return null;
  }
}

const headAt = (track: Head[], frame: number): Head => track[Math.min(track.length - 1, Math.max(0, Math.round(frame)))] ?? { top: 420, x: 540 };
// the face at a frame: the Vision box, else one built from the head track and the clip's face size
const faceOf = (faces: (Face | null)[], track: Head[], meta: Meta, frame: number): Face => {
  const f = faces[Math.min(faces.length - 1, Math.max(0, Math.round(frame)))];
  if (f) return f;
  const h = headAt(track, frame);
  return { x: h.x, y: h.top + meta.face.h * 0.55, w: meta.face.w, h: meta.face.h };
};

const Layer: React.FC<{ edit: Edit; meta: Meta; track: Head[]; faces: (Face | null)[]; side: "back" | "front" | "over" }> = ({ edit, meta, track, faces, side }) => {
  const { fps } = useVideoConfig();
  const S = useSafe();
  const floor = useKeepOut();
  // sticker spots in time order: each one avoids the faces and the stickers still on screen
  const spots = useMemo(() => {
    const out = new Map<number, Spot & { size: number }>();
    edit.fx.forEach((fx, i) => {
      if (fx.type !== "sticker") return;
      const from = Math.round(fx.at * fps);
      const taken = [...out.entries()].filter(([j]) => edit.fx[j].at + edit.fx[j].dur > fx.at && edit.fx[j].at < fx.at + fx.dur).map(([, s]) => s);
      const spot = stickerSpot(fx, (f) => faceOf(faces, track, meta, from + f), Math.max(1, Math.round(fx.dur * fps)), S, floor, taken);
      out.set(i, { ...spot, size: fx.size ?? 280 });
    });
    return out;
  }, [edit.fx, faces, track, meta, fps, S, floor]);
  return (
    <>
      {edit.fx.map((fx, i) => {
        // a sticker sits in front of the person unless it says `behind`
        const sticker = fx.type === "sticker" ? (fx.behind ? "back" : "front") : null;
        const inLayer = sticker
          ? sticker === side
          : side === "over" ? OVER.has(fx.type) : side === "back" ? BACK.has(fx.type) || BOTH.has(fx.type) : FRONT.has(fx.type) || BOTH.has(fx.type);
        if (!inLayer) return null;
        const from = Math.round(fx.at * fps);
        const len = Math.max(1, Math.round(fx.dur * fps));
        return (
          <Sequence key={i} from={from} durationInFrames={len} layout="none">
            <AbsoluteFill>{render(fx, { face: meta.face, accent: edit.accent, len, head: (f) => headAt(track, from + f), faceAt: (f) => faceOf(faces, track, meta, from + f), spot: spots.get(i) }, side === "front" ? "front" : "back")}</AbsoluteFill>
          </Sequence>
        );
      })}
    </>
  );
};

// Camera moves on the whole scene (room + back fx + person): zoom punches, 3D shakes, whips.
function camera(edit: Edit, frame: number, fps: number) {
  let s = 1, rx = 0, ry = 0, rz = 0, x = 0, blur = 0;
  for (const fx of edit.fx) {
    const from = fx.at * fps, len = fx.dur * fps;
    if (frame < from || frame > from + len) continue;
    const t = frame - from;
    if (fx.type === "punch") {
      const k = Math.min(pop(frame, fps, from, 16, 260), envelope(frame, from, len, 1, 6));
      s *= 1 + ((fx.scale ?? 1.14) - 1) * k;
    } else if (fx.type === "shake") {
      // perspective wobble that dies out over ~0.5s, riding on a push-in
      const k = Math.exp(-t / 6);
      rx += Math.sin(t * 1.9) * 7 * k;
      ry += Math.cos(t * 1.5) * 6 * k;
      rz += Math.sin(t * 2.3) * 1.6 * k;
      s *= 1 + ((fx.scale ?? 1.1) - 1) * Math.min(1, envelope(frame, from, len, 2, 6));
    } else if (fx.type === "whip") {
      const m = Math.sin(Math.PI * Math.min(1, t / Math.max(1, len)));
      x += (fx.dir ?? 1) * 260 * m;
      blur += 34 * m;
    }
  }
  return { s, rx, ry, rz, x, blur };
}

// Word-by-word captions, 1–3 words per chunk, the spoken word lights up.
function chunks(words: Word[]) {
  const out: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    const prev = cur[cur.length - 1];
    if (cur.length && (cur.length >= 3 || w.s - prev.e > 0.35 || /[.,!?…:;]$/.test(prev.w))) {
      out.push(cur);
      cur = [];
    }
    cur.push(w);
  }
  if (cur.length) out.push(cur);
  return out;
}

// dark text on light accents (lime), white on dark ones (blue)
const inkOn = (hex: string) => {
  const n = parseInt(hex.slice(1, 7), 16);
  const l = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.6 ? "#0b0b0b" : "#fff";
};

const Captions: React.FC<{ words: Word[]; accent: string }> = ({ words, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const all = chunks(words);
  const idx = all.findIndex((c, i) => t >= c[0].s - 0.05 && t < (all[i + 1]?.[0].s ?? c[c.length - 1].e + 0.6) - 0.05);
  if (idx < 0) return null;
  const c = all[idx];
  const p = pop(frame, fps, Math.round(c[0].s * fps) - 1, 14, 220);
  // shrink long chunks so they stay inside ~960px
  const chars = c.reduce((a, w) => a + w.w.length + 1, 0);
  const S = useSafe();
  const size = Math.min(66, Math.round((1040 - S.left - S.right) / (chars * 0.6)));
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: S.bottom + 40, paddingLeft: S.left, paddingRight: S.right }}>
      <div style={{ display: "flex", gap: 18, transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})`, opacity: p }}>
        {c.map((w, i) => {
          const on = t >= w.s - 0.03;
          const now = on && t < w.e + 0.05;
          return (
            <span
              key={i}
              style={{
                fontFamily: SANS,
                fontWeight: 800,
                fontSize: size,
                letterSpacing: -1.5,
                color: now ? inkOn(accent) : on ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.45)",
                background: now ? accent : "transparent",
                borderRadius: 16,
                padding: "2px 14px",
                textShadow: now ? "none" : "0 3px 16px rgba(0,0,0,.55)",
              }}
            >
              {w.w.replace(/[.,!?…:;]+$/, "")}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const CaptionLayer: React.FC<{ style: NonNullable<Edit["captionStyle"]>; words: Word[]; accent: string; plan: ReturnType<typeof captionPlan> }> = ({ style, words, accent, plan }) => {
  if (style === "mix") return <MixCaptions plan={plan} accent={accent} />;
  if (style === "serif") return <SerifCaptions words={words} />;
  if (style === "word") return <WordCaptions words={words} accent={accent} />;
  if (style === "clean") return <CleanCaptions words={words} accent={accent} />;
  return <Captions words={words} accent={accent} />;
};

// Outline = a second copy of the cutout under the real one, grown with stacked drop-shadows;
// the real cutout covers the inside, so only the ring around the body shows.
function outlineFilter(style: string, color: string) {
  const grow = (px: number, c: string) => `drop-shadow(${px}px 0 0 ${c}) drop-shadow(-${px}px 0 0 ${c}) drop-shadow(0 ${px}px 0 ${c}) drop-shadow(0 -${px}px 0 ${c})`;
  if (style === "sticker") return `brightness(0) invert(1) ${grow(11, "#fff")} drop-shadow(0 14px 26px rgba(0,0,0,.55))`;
  // rim = a soft light from behind: thin edge, wide low glow
  if (style === "rim") return `brightness(0) ${grow(1, color + "aa")} drop-shadow(0 0 16px ${color}66) drop-shadow(0 0 40px ${color}33)`;
  return `brightness(0) invert(1) ${grow(4, "#fff")} drop-shadow(0 0 14px ${color}) drop-shadow(0 0 34px ${color}) drop-shadow(0 0 70px ${color})`;
}

const Outline: React.FC<{ edit: Edit; slug: string }> = ({ edit, slug }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fx = edit.fx.find((x) => x.type === "outline" && frame >= x.at * fps && frame < (x.at + x.dur) * fps);
  if (!fx || fx.type !== "outline") return null;
  const t = frame - fx.at * fps, len = fx.dur * fps;
  const style = fx.style ?? "neon";
  // neon ignites with a flicker and is drawn head → feet; the others fade
  const flicker = style === "neon" && t < 9 ? [0, 1, 0.15, 1, 0.4, 1, 0.8, 1, 1][Math.floor(t)] : 1;
  const draw = style === "neon" ? Math.min(1, t / 10) : 1;
  const o = envelope(frame, fx.at * fps, len, style === "neon" ? 1 : 6, 6) * flicker * (style === "neon" ? 0.9 + 0.1 * Math.sin(t / 3) : 1);
  return (
    <AbsoluteFill style={{ opacity: o, filter: outlineFilter(style, fx.color ?? edit.accent), clipPath: `inset(0 0 ${(1 - draw) * 100}% 0)` }}>
      <OffthreadVideo src={staticFile(`${slug}/fg.webm`)} transparent muted />
    </AbsoluteFill>
  );
};

export const ProEdit: React.FC<ProEditData> = ({ slug, safe, meta, edit, words, track, faces = [], sfx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const plan = useMemo(() => (edit && words ? captionPlan(words, edit) : []), [edit, words]);
  if (!meta || !edit || !words || !track) return null;
  const style = edit.captionStyle ?? "mix";
  const mix = edit.captions && style === "mix";
  const h = headAt(track, frame);
  const cam = camera(edit, frame, fps);
  const g = edit.grade;
  const grade = `contrast(${g.contrast}) saturate(${g.saturate}) brightness(${g.brightness})`;
  const r = g.room;
  const room = r ? `${grade} brightness(${1 - (r.dim ?? 0)}) saturate(${1 - (r.desat ?? 0)})${r.blur ? ` blur(${r.blur}px)` : ""}` : grade;
  const scene: React.CSSProperties = {
    transform: `perspective(1400px) translateX(${cam.x}px) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) rotateZ(${cam.rz}deg) scale(${cam.s})`,
    transformOrigin: `${h.x}px ${h.top + meta.face.h * 0.4}px`,
    filter: cam.blur > 0.5 ? `blur(${cam.blur}px)` : undefined,
  };
  return (
    <SafeProvider value={{ zone: zoneOf(edit.platform), captions: edit.captions }}>
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={scene}>
        <AbsoluteFill style={{ filter: room, transform: r?.blur ? "scale(1.02)" : undefined }}>
          <OffthreadVideo src={staticFile(`${slug}/base.mp4`)} />
        </AbsoluteFill>
        <Layer edit={edit} meta={meta} track={track} faces={faces} side="back" />
        {mix ? <CaptionBack plan={plan} accent={edit.accent} head={(f) => headAt(track, f)} /> : null}
        <Outline edit={edit} slug={slug} />
        <AbsoluteFill style={{ filter: grade }}>
          <OffthreadVideo src={staticFile(`${slug}/fg.webm`)} transparent muted />
        </AbsoluteFill>
      </AbsoluteFill>
      <Layer edit={edit} meta={meta} track={track} faces={faces} side="front" />
      <Layer edit={edit} meta={meta} track={track} faces={faces} side="over" />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,${g.vignette}) 100%)`, pointerEvents: "none" }} />
      {/* captions over every layer: no card, title card or cutaway can cover them */}
      {edit.captions ? <CaptionLayer style={style} words={words} accent={edit.accent} plan={plan} /> : null}
      <Grain />
      <Sounds edit={edit} index={sfx ?? {}} gain={voiceGain(meta)} />
      {edit.music ? <Music music={edit.music} words={words} gain={voiceGain(meta)} /> : null}
      {safe ? <SafeOverlay platform={safe} /> : null}
    </AbsoluteFill>
    </SafeProvider>
  );
};
