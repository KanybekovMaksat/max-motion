// ── MIX CAPTIONS: the default style. A short phrase in small sans; its key word in serif italic
//    or condensed caps; words come in on their own timing — slide up through a blur, rise out of a
//    mask, pop, or type letter by letter; every ~3rd phrase sends the key word behind the person.
//    Everything stays inside the platform safe zone (safe.tsx).
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COND, SANS, SERIF } from "./fonts";
import { fitCaption } from "./layout";
import { phrases } from "./fx2";
import { CAPTION_H, CAPTION_LIFT, useSafe } from "./safe";
import { clamp01, pop } from "./time";
import type { Edit, Head, Word } from "./types";

type Role = "plain" | "serif" | "caps";
type Enter = "blur" | "rise" | "type" | "pop";
export type Cap = { words: Word[]; key: number; role: Role; enter: Enter; behind: boolean; stack: boolean; s: number; e: number };

const clean = (w: string) => w.replace(/[.,!?…:;«»"“”()]+/g, "");
// glyph width per em, to fit a word into the line (Cyrillic is a bit wider than Latin), and the
// size each role wants before the phrase is fitted into the caption band
const EM: Record<Role, number> = { plain: 0.56, serif: 0.6, caps: 0.52 };
const MAX: Record<Role, number> = { plain: 50, serif: 104, caps: 92 };

// The word that carries the phrase: a number, a word listed in edit.captionKeys, else the longest of 5+ letters.
function keyOf(ph: Word[], keys: string[]) {
  const num = ph.findIndex((w) => /\d/.test(w.w));
  if (num >= 0) return num;
  const listed = ph.findIndex((w) => keys.includes(clean(w.w).toLowerCase()));
  if (listed >= 0) return listed;
  let best = -1;
  ph.forEach((w, i) => {
    const n = clean(w.w).length;
    if (n >= 5 && (best < 0 || n > clean(ph[best].w).length)) best = i;
  });
  return best;
}

// effects that already own the space behind the head or the whole screen
const BUSY = new Set(["behind", "film", "title", "broll", "chart"]);

export function captionPlan(words: Word[], edit: Edit): Cap[] {
  const keys = (edit.captionKeys ?? []).map((k) => k.toLowerCase());
  const all = phrases(words);
  let since = 9;
  return all.map((ph, i) => {
    const key = keyOf(ph, keys);
    const role: Role = key < 0 ? "plain" : /\d/.test(ph[key].w) || i % 3 === 1 ? "caps" : "serif";
    const s = ph[0].s;
    const e = all[i + 1]?.[0].s ?? ph[ph.length - 1].e + 0.6;
    const busy = edit.fx.some((f) => BUSY.has(f.type) && f.at < e && f.at + f.dur > s);
    const behind = edit.captionBehind !== false && key >= 0 && role !== "plain" && ph.length >= 2 && clean(ph[key].w).length >= 5 && !busy && since >= 2;
    since = behind ? 0 : since + 1;
    return {
      words: ph,
      key,
      role,
      enter: (["blur", "rise", "type"] as const)[i % 3],
      behind,
      // "are going / viral." — the closing key word drops to its own line
      stack: !behind && role === "serif" && key === ph.length - 1 && ph.length >= 2,
      s,
      e,
    };
  });
}

const active = (plan: Cap[], t: number) => plan.find((c) => t >= c.s - 0.06 && t < c.e - 0.04);

const font = (role: Role, size: number, accent: string): React.CSSProperties =>
  role === "serif"
    ? { fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: size, letterSpacing: -size * 0.02, color: "#fff" }
    : role === "caps"
      ? { fontFamily: COND, fontWeight: 600, fontSize: size, letterSpacing: size * 0.01, color: accent, textTransform: "uppercase" }
      : { fontFamily: SANS, fontWeight: 500, fontSize: size, letterSpacing: -size * 0.025, color: "#fff" };

const shadow = "0 3px 18px rgba(0,0,0,.55), 0 1px 3px rgba(0,0,0,.35)";

const CapWord: React.FC<{ w: Word; role: Role; enter: Enter; size: number; accent: string }> = ({ w, role, enter, size, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = Math.round((w.s - 0.06) * fps);
  const text = clean(w.w);
  const base: React.CSSProperties = { ...font(role, size, accent), display: "inline-block", lineHeight: 1.08, whiteSpace: "nowrap", textShadow: shadow };
  const how: Enter = role === "serif" ? "pop" : role === "caps" ? "type" : enter;

  if (how === "type") {
    // letters print over ~the spoken length (3–10 frames), the rest is held invisible so the line doesn't jump
    const span = Math.max(3, Math.min(10, Math.round((w.e - w.s) * fps * 0.8)));
    const n = Math.ceil(text.length * clamp01((frame - start + 1) / span));
    if (n <= 0) return <span style={{ ...base, opacity: 0 }}>{text}</span>;
    const typing = n < text.length;
    return (
      <span style={base}>
        {text.slice(0, n)}
        <span style={{ opacity: 0 }}>{text.slice(n)}</span>
        {typing ? <span style={{ position: "absolute", width: Math.max(4, size * 0.06), height: size * 0.9, marginLeft: -size * 0.02, marginTop: size * 0.1, background: accent }} /> : null}
      </span>
    );
  }
  if (how === "rise") {
    // comes up out of a mask under the baseline
    const p = pop(frame, fps, start, 16, 230);
    return (
      <span style={{ display: "inline-block", overflow: "hidden", paddingBottom: size * 0.14, marginBottom: -size * 0.14, verticalAlign: "bottom" }}>
        <span style={{ ...base, transform: `translateY(${(1 - p) * 110}%)` }}>{text}</span>
      </span>
    );
  }
  if (how === "pop") {
    const p = pop(frame, fps, start, 9, 240);
    return <span style={{ ...base, opacity: clamp01(p * 2), transform: `scale(${0.35 + 0.65 * p}) rotate(${(1 - p) * -8}deg)`, filter: `blur(${(1 - clamp01(p)) * 6}px)`, transformOrigin: "50% 70%" }}>{text}</span>;
  }
  // blur: slides up out of a blur
  const p = pop(frame, fps, start, 15, 200);
  return <span style={{ ...base, opacity: clamp01(p * 1.4), filter: `blur(${(1 - clamp01(p)) * 12}px)`, transform: `translateY(${(1 - p) * 36}px)` }}>{text}</span>;
};

export const MixCaptions: React.FC<{ plan: Cap[]; accent: string }> = ({ plan, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const S = useSafe();
  const t = frame / fps;
  const c = active(plan, t);
  if (!c) return null;
  // a little narrower than the box: the glyph widths are estimates
  const width = (1080 - S.left - S.right - 40) * 0.96;
  const out = clamp01(((c.e - 0.04 - t) * fps) / 4);
  const show = c.words.map((w, i) => ({ w, i })).filter(({ i }) => !(c.behind && i === c.key));
  const roleOf = (i: number): Role => (i === c.key ? c.role : "plain");
  const lines = c.stack ? [show.filter(({ i }) => i !== c.key), show.filter(({ i }) => i === c.key)] : [show];
  // every phrase fits the caption band, so a card above it can never be overlapped
  const { sizes } = fitCaption(lines.map((l) => l.map(({ w, i }) => ({ chars: clean(w.w).length, em: EM[roleOf(i)], max: MAX[roleOf(i)] }))), width, CAPTION_H);
  const word = ({ w, i }: { w: Word; i: number }, size: number) => <CapWord key={i} w={w} role={roleOf(i)} enter={c.enter} size={size} accent={accent} />;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: S.left + 20,
          right: S.right + 20,
          bottom: S.bottom + CAPTION_LIFT,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          opacity: out,
          filter: out < 1 ? `blur(${(1 - out) * 8}px)` : undefined,
          transform: `translateY(${-(1 - out) * 18}px)`,
        }}
      >
        {lines.map((l, j) => (
          <div key={j} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline", columnGap: 14, marginTop: j ? -8 : 0 }}>
            {l.map((x, n) => word(x, sizes[j][n]))}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// The key word of a "behind" phrase, big, between the room and the person (rendered under the cutout).
export const CaptionBack: React.FC<{ plan: Cap[]; accent: string; head: (frame: number) => Head }> = ({ plan, accent, head }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const S = useSafe();
  const c = active(plan, frame / fps);
  if (!c || !c.behind) return null;
  const w = c.words[c.key];
  const text = c.role === "caps" ? clean(w.w).toUpperCase() : clean(w.w);
  const width = 1080 - S.left - S.right;
  const size = Math.min(c.role === "caps" ? 300 : 260, Math.round(width / (Math.max(3, text.length) * (c.role === "caps" ? 0.5 : 0.6))));
  const start = Math.round((w.s - 0.08) * fps);
  const h = head(start);
  // sits on the head like the `behind` effect, but never above the safe top
  const top = Math.max(S.top, h.top + size * 0.12 - size * 0.62);
  const out = clamp01(((c.e - 0.04) * fps - frame) / 6);
  const fill =
    c.role === "caps"
      ? `linear-gradient(180deg, #ffffff 0%, ${accent} 55%, ${accent} 100%)`
      : "linear-gradient(180deg, #ffffff 0%, #e9ecf1 40%, #9aa1ab 62%, #f4f5f7 100%)";
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top, left: S.left, right: S.right, textAlign: "center", opacity: out, whiteSpace: "nowrap", lineHeight: 1, filter: "drop-shadow(0 8px 30px rgba(0,0,0,.4))" }}>
        {[...text].map((ch, i) => {
          const p = pop(frame, fps, start + i * 1.3, 12, 190);
          return (
            <span
              key={i}
              style={{
                ...font(c.role, size, accent),
                fontWeight: c.role === "serif" ? 500 : 600,
                display: "inline-block",
                transform: `translateY(${(1 - p) * size * 0.4}px)`,
                opacity: clamp01(p * 1.6),
                filter: `blur(${(1 - clamp01(p)) * 14}px)`,
                background: fill,
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
