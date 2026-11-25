import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COND, SANS, SERIF } from "./fonts";
import { AppIcon } from "./icons";
import ICONS from "./icon-paths.json";
import { useKeepOut, useSafe, useSlot } from "./safe";
import { clamp01, ease, envelope, pop } from "./time";
import type { Face, Fx, Head, StickerPos } from "./types";

// Every effect renders inside its own <Sequence>, so useCurrentFrame() is 0 at the effect start.
// `head(f)` = head position at local frame f of the effect (follows the person).
type P<T extends Fx["type"]> = { fx: Extract<Fx, { type: T }>; face: Face; accent: string; len: number; head: (f: number) => Head; faceAt: (f: number) => Face };

const src = (s: string) => (/^(https?:|data:)/.test(s) ? s : staticFile(s));
const isVideo = (s: string) => /\.(mp4|mov|webm)$/i.test(s);

// ── BEHIND: the giant word between background and person ────────────────────
export const Behind: React.FC<P<"behind">> = ({ fx, accent, len, head }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const font = fx.font ?? "sans";
  const text = font === "cond" ? fx.text.toUpperCase() : fx.text;
  // glyph width per em: Inter 800 ≈ 0.7 (Cyrillic), Playfair italic ≈ 0.68, Oswald caps (Cyrillic) ≈ 0.6; keep the word inside ~900px
  const em = font === "cond" ? 0.6 : font === "serif" ? 0.68 : 0.7;
  const S = useSafe();
  const size = Math.min(font === "sans" ? 300 : 340, Math.round((1060 - S.left - S.right) / (Math.max(3, text.length) * em)));
  // serif and condensed words are white-metal, like "Sold" / "DEGREE" (unless given a colour); sans words take the accent
  const fill =
    font === "sans" || fx.color
      ? `linear-gradient(180deg, #ffffff 0%, ${fx.color ?? accent} 55%, ${fx.color ?? accent} 100%)`
      : `linear-gradient(180deg, #ffffff 0%, #e9ecf1 40%, #9aa1ab 62%, #f4f5f7 100%)`;
  const family = font === "serif" ? SERIF : font === "cond" ? COND : SANS;
  // the word sits on the head: its lower ~40% disappears behind the hair
  const y = fx.y ?? head(0).top + size * 0.12;
  const out = interpolate(f, [len - 7, len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: Math.max(S.top - (fx.kicker ? 0 : size * 0.1), y - size * 0.62), left: S.left, right: S.right, textAlign: "center", opacity: out }}>
        {fx.kicker ? (
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 500,
              fontSize: 54,
              color: "rgba(255,255,255,.92)",
              letterSpacing: -1,
              marginBottom: -size * 0.16,
              opacity: clamp01(f / 6),
              textShadow: "0 2px 18px rgba(0,0,0,.35)",
            }}
          >
            {fx.kicker}
          </div>
        ) : null}
        <div
          style={{
            fontFamily: family,
            fontStyle: font === "serif" ? "italic" : "normal",
            fontWeight: font === "serif" ? 500 : font === "cond" ? 600 : 800,
            fontSize: size,
            letterSpacing: font === "sans" ? -size * 0.055 : font === "cond" ? -size * 0.01 : -size * 0.03,
            lineHeight: 1,
            whiteSpace: "nowrap",
            filter: font === "sans" ? undefined : "drop-shadow(0 8px 30px rgba(0,0,0,.45))",
          }}
        >
          {[...text].map((ch, i) => {
            const p = pop(f, fps, 2 + i * 1.4, 12, 190);
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  transform: `translateY(${(1 - p) * size * 0.45}px) scale(${0.85 + 0.15 * p})`,
                  opacity: clamp01(p * 1.6),
                  filter: `blur(${(1 - clamp01(p)) * 14}px)`,
                  background: fill,
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                  textShadow: "none",
                }}
              >
                {ch === " " ? " " : ch}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── POP: photos fly out from behind the shoulders ────────────────────────────
// frame positions relative to the head top: upper corners first, then lower sides
const POP_SLOTS = [
  { x: 200, y: 90, r: -9 },
  { x: 880, y: 30, r: 8 },
  { x: 190, y: 600, r: 6 },
  { x: 890, y: 650, r: -7 },
];
export const Pop: React.FC<P<"pop">> = ({ fx, len, head }) => {
  const h0 = head(0);
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const floor = useKeepOut();
  return (
    <AbsoluteFill>
      {fx.images.slice(0, 4).map((im, i) => {
        const p = pop(f, fps, i * 4, 11, 150);
        const o = envelope(f, i * 4, len - i * 4, 3, 7);
        const s = POP_SLOTS[i];
        // fly from behind the head to the slot
        const w = 300, h = 380;
        // the lower photos stop above the caption band
        const cx = h0.x + (s.x - h0.x) * p, cy = Math.min(floor - h / 2 - 20, h0.top + 250 + (s.y - 250) * p);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx - w / 2,
              top: cy - h / 2,
              width: w,
              height: h,
              borderRadius: 34,
              overflow: "hidden",
              border: "7px solid #fff",
              boxShadow: "0 30px 70px rgba(0,0,0,.45)",
              opacity: o,
              transform: `scale(${0.25 + 0.75 * p}) rotate(${s.r * p + (1 - p) * -20}deg) translateY(${Math.sin((f + i * 9) / 14) * 6}px)`,
            }}
          >
            <Img src={src(im)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ── DOT ICON: a monochrome icon built from glowing dots (the references' dot-matrix objects) ──
// a grid of dots masked by the icon shape; dots switch on in a scattered order, a light sweep runs
// across, a soft accent bloom sits behind. `dim` (0..1) fades it for a strike-through.
const GRID = 30; // dots across the 256-unit icon box
export const DotIcon: React.FC<{ name: string; size: number; f: number; fps: number; accent: string; dim?: number; id: string }> = ({ name, size, f, fps, accent, dim = 0, id }) => {
  const shape = (ICONS as Record<string, string>)[name];
  if (!shape) throw new Error(`unknown icon "${name}" — see src/icon-paths.json`);
  const step = 256 / GRID;
  const dots: React.ReactNode[] = [];
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const x = (gx + 0.5) * step, y = (gy + 0.5) * step;
      const on = pop(f, fps, random(`${id}-${gx}-${gy}`) * 9, 14, 220);
      if (on <= 0.01) continue;
      // light sweep: a diagonal band of brighter, slightly bigger dots
      const sweep = Math.max(0, Math.cos((x + y) / 70 - f / 7));
      const r = step * (0.3 + 0.1 * sweep) * Math.min(1.15, on);
      dots.push(<circle key={`${gx}-${gy}`} cx={x} cy={y} r={r} fillOpacity={(0.55 + 0.45 * sweep) * (1 - 0.6 * dim)} />);
    }
  }
  return (
    <svg viewBox="0 0 256 256" width={size} height={size} style={{ position: "absolute", inset: 0, overflow: "visible", filter: "drop-shadow(0 6px 16px rgba(0,0,0,.6))" }}>
      <defs>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={0} y={0} width={256} height={256}>
          <g fill="#fff" dangerouslySetInnerHTML={{ __html: shape }} />
        </mask>
        <radialGradient id={`${id}-b`}>
          <stop offset="0%" stopColor={accent} stopOpacity={0.35 * (1 - dim)} />
          <stop offset="100%" stopColor={accent} stopOpacity={0} />
        </radialGradient>
        <filter id={`${id}-g`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx={128} cy={128} r={150} fill={`url(#${id}-b)`} opacity={clamp01(f / 10)} />
      <g mask={`url(#${id}-m)`} filter={`url(#${id}-g)`} fill="#F4F7FB">
        {dots}
      </g>
    </svg>
  );
};

// ── STICKER: an icon (`icon:<name>`, dot style) or a real picture (cut-out PNG) pops next to the head on its word ──
// spring in with a twist, floats, scales out; `strike` greys it out and draws a red line across.
// Placed around the head (in face widths), kept inside the safe box and above the caption band.
const STICKER_AT: Record<StickerPos, [number, number]> = {
  left: [-1, 0.2], right: [1, 0.2], "top-left": [-0.85, -0.6], "top-right": [0.85, -0.6], "low-left": [-1.05, 1.05], "low-right": [1.05, 1.05],
};
export type Spot = { x: number; y: number; kx: number };
type Box = { top: number; left: number; right: number };
// where a sticker goes: the asked-for spot unless it covers the face (in any shot of its life — a cut may
// move the face) or a sticker already on screen; then the mirrored spot, the top corners, the low ones,
// else the least bad. `faceAt` takes the sticker's local frame.
export function stickerSpot(fx: Extract<Fx, { type: "sticker" }>, faceAt: (f: number) => Face, len: number, S: Box, floor: number, taken: (Spot & { size: number })[] = []): Spot {
  const size = fx.size ?? 280;
  const c = faceAt(0);
  const seen = [0, Math.floor(len / 2), len - 1].map(faceAt);
  const overlap = (x: number, y: number, l: number, r: number, t: number, b: number) =>
    Math.max(0, Math.min(x + size * 0.42, r) - Math.max(x - size * 0.42, l)) * Math.max(0, Math.min(y + size * 0.42, b) - Math.max(y - size * 0.42, t));
  const place = (p: StickerPos) => {
    const [kx, ky] = STICKER_AT[p];
    const x = Math.min(1080 - S.right - size / 2, Math.max(S.left + size / 2, c.x + kx * (c.w * 0.75 + size * 0.5)));
    const y = Math.min(floor - size / 2 - 10, Math.max(S.top + size / 2, c.y + ky * c.h * 1.1));
    // px² over the face and hairline (cheek to cheek, forehead to chin), summed over its life,
    // plus the other stickers (counted double: two icons on top of each other read as a mess)
    const face = seen.reduce((sum, q) => sum + overlap(x, y, q.x - q.w * 0.6, q.x + q.w * 0.6, q.y - q.h * 0.8, q.y + q.h * 0.6), 0);
    const other = taken.reduce((sum, o) => sum + 2 * overlap(x, y, o.x - o.size * 0.5, o.x + o.size * 0.5, o.y - o.size * 0.5, o.y + o.size * 0.5), 0);
    return { x, y, kx, hit: face + other };
  };
  const want = fx.pos ?? "right";
  const mirror = (want.includes("left") ? want.replace("left", "right") : want.replace("right", "left")) as StickerPos;
  const tries = [want, mirror, "top-left", "top-right", "low-left", "low-right"].map((p) => place(p as StickerPos));
  const { x, y, kx } = tries.find((t) => t.hit === 0) ?? tries.reduce((a, b) => (b.hit < a.hit ? b : a));
  return { x, y, kx };
}

export const Sticker: React.FC<P<"sticker"> & { spot?: Spot }> = ({ fx, accent, len, faceAt, spot }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const S = useSafe();
  const floor = useKeepOut();
  const size = fx.size ?? 280;
  const { x: cx, y: cy, kx } = spot ?? stickerSpot(fx, faceAt, len, S, floor);
  const p = pop(f, fps, 0, 11, 260);
  const out = envelope(f, 0, len, 1, 6);
  const icon = fx.src.startsWith("icon:");
  const tilt = fx.tilt ?? (icon ? 0 : kx < 0 ? -8 : 8);
  const struck = fx.strike !== undefined ? clamp01((f - fx.strike * fps) / 6) : 0;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: cx - size / 2,
          top: cy - size / 2,
          width: size,
          height: size,
          opacity: clamp01(p * 2) * out,
          transform: `translateY(${Math.sin((f + size) / 13) * 7}px) scale(${(0.2 + 0.8 * p) * (0.85 + 0.15 * out)}) rotate(${tilt * p + (1 - p) * -30}deg)`,
        }}
      >
        {fx.src.startsWith("icon:") ? (
          <DotIcon name={fx.src.slice(5)} size={size} f={f} fps={fps} accent={accent} dim={struck} id={`dots-${Math.round(fx.at * 100)}`} />
        ) : (
          <Img src={src(fx.src)} style={{ width: "100%", height: "100%", objectFit: "contain", filter: `drop-shadow(0 22px 34px rgba(0,0,0,.55)) grayscale(${struck}) brightness(${1 - 0.35 * struck})` }} />
        )}
        {struck > 0 ? (
          <svg width={size} height={size} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <line x1={size * 0.08} y1={size * 0.92} x2={size * 0.08 + size * 0.84 * struck} y2={size * 0.92 - size * 0.84 * struck} stroke="#FF3D57" strokeWidth={size * 0.07} strokeLinecap="round" />
          </svg>
        ) : null}
        {fx.label ? (
          <div style={{ position: "absolute", left: "50%", top: size * 0.98, transform: "translateX(-50%)", whiteSpace: "nowrap", fontFamily: SANS, fontWeight: 600, fontSize: 30, color: "#fff", letterSpacing: -0.3, textShadow: "0 2px 12px rgba(0,0,0,.6)" }}>
            {fx.label}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// ── HALO: glowing arc ring behind the head ───────────────────────────────────
export const Halo: React.FC<P<"halo">> = ({ fx, face: face0, accent, len, head }) => {
  const f = useCurrentFrame();
  const face = { ...face0, x: head(f).x, y: head(f).top + face0.h * 0.35 };
  const color = fx.color ?? accent;
  const r = face.w * 1.05;
  const draw = interpolate(f, [0, 18], [0, 1], { extrapolateRight: "clamp", easing: ease });
  const o = envelope(f, 0, len, 4, 10);
  const C = 2 * Math.PI * r;
  const cy = face.y + face.h * 0.55;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="halo-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="14" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g transform={`rotate(${150 + f * 0.6} ${face.x} ${cy})`} filter="url(#halo-glow)">
          <circle cx={face.x} cy={cy} r={r} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" strokeDasharray={`${C * 0.66 * draw} ${C}`} />
          <circle cx={face.x} cy={cy} r={r + 34} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={3} strokeLinecap="round" strokeDasharray={`${C * 0.3 * draw} ${C * 2}`} />
        </g>
        {/* bright dot riding the arc end */}
        {(() => {
          const a = ((150 + f * 0.6 + 360 * 0.66 * draw) * Math.PI) / 180;
          return <circle cx={face.x + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r={13} fill="#fff" filter="url(#halo-glow)" />;
        })()}
      </svg>
    </AbsoluteFill>
  );
};

// ── CARD: glass UI card in front ("The house ✓ Sold") ────────────────────────
export const Card: React.FC<P<"card">> = ({ fx, len }) => {
  const f = useCurrentFrame();
  const slot = useSlot();
  const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 14, 160);
  const b = pop(f, fps, 9, 9, 260);
  const o = envelope(f, 0, len, 2, 7);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          ...slot,
          height: 170,
          borderRadius: 40,
          background: "rgba(255,255,255,.9)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 30px 80px rgba(0,0,0,.4)",
          display: "flex",
          alignItems: "center",
          gap: 28,
          padding: "0 30px",
          opacity: o,
          transform: `translateY(${(1 - p) * 160}px) scale(${0.9 + 0.1 * p})`,
        }}
      >
        {fx.image ? <Img src={src(fx.image)} style={{ width: 110, height: 110, borderRadius: 24, objectFit: "cover" }} /> : null}
        <div style={{ flex: 1, fontFamily: SANS, fontWeight: 700, fontSize: 46, color: "#111", letterSpacing: -1 }}>{fx.title}</div>
        {fx.badge ? (
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 36,
              color: "#fff",
              background: "#22C55E",
              borderRadius: 99,
              padding: "14px 26px",
              transform: `scale(${b})`,
              boxShadow: "0 8px 24px rgba(34,197,94,.45)",
            }}
          >
            ✓ {fx.badge}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// ── ORBIT: icons circling the person; back half renders under the cutout ─────
export const Orbit: React.FC<P<"orbit"> & { side: "back" | "front" }> = ({ fx, face: face0, len, side, head }) => {
  const f = useCurrentFrame();
  const face = { ...face0, x: head(f).x, y: head(f).top + face0.h * 0.35 };
  const { fps } = useVideoConfig();
  const o = envelope(f, 0, len, 6, 8);
  const grow = pop(f, fps, 0, 14, 120);
  const rx = face.w * 1.55 * grow, ry = face.w * 0.3 * grow;
  const cy = Math.min(useKeepOut() - ry - 100, face.y + face.h * 1.25);
  const n = fx.icons.length;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {fx.icons.map((name, i) => {
        const a = (i / n) * Math.PI * 2 + f * 0.045;
        const depth = Math.sin(a); // >0 = towards camera
        if ((depth > 0) !== (side === "front")) return null;
        const s = 150 * (0.78 + 0.22 * depth);
        return (
          <div key={name + i} style={{ position: "absolute", left: face.x + Math.cos(a) * rx - s / 2, top: cy + depth * ry - s / 2 - Math.cos(a) * 40 }}>
            <AppIcon name={name} size={s} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ── BACKLIGHT: dim the room, light up a coloured glow behind the person ──────
export const Backlight: React.FC<P<"backlight">> = ({ fx, face: face0, accent, len, head }) => {
  const f = useCurrentFrame();
  const face = { ...face0, x: head(f).x, y: head(f).top + face0.h * 0.35 };
  const o = envelope(f, 0, len, 12, 12);
  const color = fx.color ?? accent;
  const breathe = 1 + Math.sin(f / 9) * 0.04;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ background: "rgba(4,6,14,.55)" }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${face.w * 1.6 * breathe}px ${face.w * 2.1 * breathe}px at ${face.x}px ${face.y + face.h * 0.4}px, ${color}cc 0%, ${color}55 40%, transparent 72%)`,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};

// ── RAYS: light beams sweeping from the top ──────────────────────────────────
export const Rays: React.FC<P<"rays">> = ({ fx, len }) => {
  const f = useCurrentFrame();
  const o = envelope(f, 0, len, 10, 12);
  const color = fx.color ?? "#ffffff";
  return (
    <AbsoluteFill style={{ opacity: o * 0.6, mixBlendMode: "screen" }}>
      {[-1, 0, 1].map((k) => {
        const swing = Math.sin(f / 22 + k * 1.7) * 9;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: 540 + k * 320 - 170,
              top: -200,
              width: 340,
              height: 1900,
              transformOrigin: "50% 0%",
              transform: `rotate(${k * 18 + swing}deg)`,
              background: `linear-gradient(180deg, ${color} 0%, ${color}66 30%, transparent 85%)`,
              filter: "blur(44px)",
              clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ── FILM: film strip behind the head with a serif word on it ─────────────────
export const Film: React.FC<P<"film">> = ({ fx, accent, len, head }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 15, 120);
  const o = envelope(f, 0, len, 4, 8);
  const top = head(0).top - 230;
  const frameW = 300, H = 300;
  const imgs = [...fx.images, ...fx.images, ...fx.images];
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: -200, right: -200, top, height: H, transform: `rotate(-5deg) scaleX(${p})`, background: "#0b0b0b", boxShadow: "0 30px 80px rgba(0,0,0,.5)" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", gap: 14, padding: "40px 0", transform: `translateX(${-f * 5}px)` }}>
          {imgs.map((im, i) => (
            <Img key={i} src={src(im)} style={{ width: frameW, height: H - 80, objectFit: "cover", borderRadius: 8, flex: "none", filter: "saturate(.8) brightness(.8)" }} />
          ))}
        </div>
        {[0, 1].map((row) => (
          <div key={row} style={{ position: "absolute", left: 0, right: 0, top: row ? H - 30 : 8, height: 22, display: "flex", gap: 26, paddingLeft: 10, transform: `translateX(${-(f * 5) % 48}px)` }}>
            {Array.from({ length: 40 }, (_, i) => (
              <div key={i} style={{ width: 22, height: 22, borderRadius: 5, background: "#f2f2f2", flex: "none" }} />
            ))}
          </div>
        ))}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 900, fontSize: 210, color: accent, letterSpacing: -4, textShadow: "0 6px 30px rgba(0,0,0,.6)", transform: `scale(${0.8 + 0.2 * p})` }}>
            {fx.text}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── SEARCH: a search bar that types itself ───────────────────────────────────
export const Search: React.FC<P<"search">> = ({ fx, len }) => {
  const f = useCurrentFrame();
  const slot = useSlot();
  const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 14, 170);
  const o = envelope(f, 0, len, 2, 7);
  // typing finishes at ~65% of the effect, whatever the length
  const typed = fx.text.slice(0, Math.ceil(fx.text.length * clamp01((f - 4) / (len * 0.65 - 4))));
  const done = typed.length === fx.text.length;
  const caret = Math.floor(f / 8) % 2 === 0 || !done;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          ...slot,
          height: 132,
          borderRadius: 99,
          background: "#fff",
          boxShadow: "0 24px 70px rgba(0,0,0,.4), 0 0 0 8px rgba(255,255,255,.18)",
          display: "flex",
          alignItems: "center",
          padding: "0 44px",
          gap: 26,
          opacity: o,
          transform: `translateY(${(1 - p) * 120}px) scale(${0.92 + 0.08 * p})`,
        }}
      >
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.6" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.6-3.6" />
        </svg>
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 50, color: "#111", letterSpacing: -0.5, whiteSpace: "nowrap", overflow: "hidden" }}>
          {typed}
          <span style={{ opacity: caret ? 1 : 0, color: "#3B82F6" }}>|</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── BROLL: full-screen cutaway with a whip in/out ────────────────────────────
export const Broll: React.FC<P<"broll">> = ({ fx, len }) => {
  const f = useCurrentFrame();
  const S = useSafe();
  const floor = useKeepOut();
  const inP = interpolate(f, [0, 7], [1, 0], { extrapolateRight: "clamp", easing: ease });
  const outP = interpolate(f, [len - 6, len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const x = inP * 1080 - outP * 1080;
  const blur = (inP + outP) * 40;
  const kb = 1.08 + (f / len) * 0.08;
  return (
    <AbsoluteFill style={{ transform: `translateX(${x}px)`, filter: `blur(${blur}px)`, background: "#000" }}>
      {isVideo(fx.src) ? (
        <OffthreadVideo src={src(fx.src)} muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kb})` }} />
      ) : (
        <Img src={src(fx.src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kb})` }} />
      )}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 55%, rgba(0,0,0,.75) 100%)" }} />
      {fx.text ? (
        <div style={{ position: "absolute", left: S.left, right: S.right, bottom: 1920 - floor, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 110, color: "#fff", lineHeight: 1, opacity: clamp01((f - 4) / 6) }}>
          {fx.text}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── RIBBON: a swoosh wrapping the body — drawn back half first, then the front ─
export const Ribbon: React.FC<P<"ribbon"> & { side: "back" | "front" }> = ({ fx, face, len, head, side }) => {
  const f = useCurrentFrame();
  const h = head(f);
  const color = fx.color ?? "#C6F432";
  const o = interpolate(f, [len - 8, len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // around the chest: two face-heights below the top of the head
  const rx = 470, ry = 130;
  const cx = h.x, cy = Math.min(useKeepOut() - ry - 60, h.top + face.h * 2);
  // ellipse halves; the back half runs over the top (behind the shoulders), the front half under
  const back = `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`;
  const front = `M ${cx + rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy}`;
  const tail = `M ${cx - rx} ${cy} C ${cx - rx - 60} ${cy - 260}, ${cx - 120} ${cy - 520}, ${cx + 40} ${cy - 760}`;
  const L = Math.PI * rx * 1.1;
  const pBack = interpolate(f, [0, 9], [0, 1], { extrapolateRight: "clamp", easing: ease });
  const pFront = interpolate(f, [7, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const pTail = interpolate(f, [12, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const stroke = (d: string, p: number, w: number, c: string, dash = L) => (
    <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={`${dash * p} ${dash * 2}`} />
  );
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", filter: `drop-shadow(0 12px 24px rgba(0,0,0,.35))` }}>
        <g transform={`rotate(-10 ${cx} ${cy}) translate(0 ${Math.sin(f / 10) * 8})`}>
          {side === "back" ? (
            <>
              {stroke(tail, pTail, 46, color, 900)}
              {stroke(back, pBack, 70, color)}
              {stroke(back, pBack, 10, "rgba(255,255,255,.7)")}
            </>
          ) : (
            <>
              {stroke(front, pFront, 70, color)}
              {stroke(front, pFront, 10, "rgba(255,255,255,.7)")}
            </>
          )}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ── QUOTE: a note card with a serif quote typed in ───────────────────────────
export const Quote: React.FC<P<"quote">> = ({ fx, len }) => {
  const f = useCurrentFrame();
  const slot = useSlot();
  const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 13, 150);
  const o = envelope(f, 0, len, 2, 7);
  const shown = fx.text.slice(0, Math.floor(Math.max(0, f - 5) * 1.3));
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          ...slot,
          borderRadius: 30,
          background: "#FFFDF6",
          padding: "34px 44px 30px",
          boxShadow: "0 30px 80px rgba(0,0,0,.45)",
          opacity: o,
          transform: `translateY(${(1 - p) * 140}px) rotate(${(1 - p) * -6 - 1.5}deg)`,
        }}
      >
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 120, lineHeight: 0.5, color: "#3B82F6", height: 50 }}>“</div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 56, lineHeight: 1.15, color: "#111", minHeight: 130 }}>{shown}</div>
        {fx.author ? <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 28, color: "#777", marginTop: 14 }}>— {fx.author}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

// ── Film grain, generated per frame ──────────────────────────────────────────
export const Grain: React.FC<{ amount?: number }> = ({ amount = 0.08 }) => {
  const f = useCurrentFrame();
  const seed = Math.floor(random(`g${f}`) * 1000);
  return (
    <AbsoluteFill style={{ opacity: amount, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="1080" height="1920">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};
