// Effects found in the second pass over @eightsenses.media (26 reels): stat counter, checklist,
// chat bubble, progress card, dot globe, chart, serif slide-in captions.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COND, SANS, SERIF } from "./fonts";
import { clamp01, ease, envelope, pop } from "./time";
import type { Face, Fx, Head, Word } from "./types";

type P<T extends Fx["type"]> = { fx: Extract<Fx, { type: T }>; face: Face; accent: string; len: number; head: (f: number) => Head };

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,.86)",
  backdropFilter: "blur(22px)",
  boxShadow: "0 24px 60px rgba(0,0,0,.35), inset 0 0 0 1.5px rgba(255,255,255,.6)",
  borderRadius: 30,
};

// ── COUNTER: "TOTAL LISTINGS 165" counting up, bottom left ────────────────────
export const Counter: React.FC<P<"counter">> = ({ fx, len }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 15, 170);
  const o = envelope(f, 0, len, 3, 7);
  const k = interpolate(f, [2, Math.min(len - 4, 26)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const n = Math.round((fx.from ?? 0) + (fx.to - (fx.from ?? 0)) * k);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: 90, top: 1170, transform: `translateY(${(1 - p) * 60}px)` }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 3, color: "rgba(255,255,255,.9)", textTransform: "uppercase" }}>{fx.label}</div>
        <div style={{ fontFamily: COND, fontWeight: 600, fontSize: 210, lineHeight: 0.95, color: "#fff", letterSpacing: -2, fontVariantNumeric: "tabular-nums", textShadow: "0 8px 40px rgba(0,0,0,.45)" }}>
          {fx.prefix ?? ""}
          {n.toLocaleString("ru-RU")}
          {fx.suffix ?? ""}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── CHECKLIST: pills tick in one after another ───────────────────────────────
export const Checklist: React.FC<P<"checklist">> = ({ fx, accent, len }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const o = envelope(f, 0, len, 2, 7);
  const gap = Math.max(5, Math.min(10, Math.floor((len - 10) / Math.max(1, fx.items.length))));
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: 90, top: 1150, display: "flex", flexDirection: "column", gap: 16 }}>
        {fx.items.map((it, i) => {
          const p = pop(f, fps, i * gap, 14, 200);
          const tick = pop(f, fps, i * gap + 5, 10, 300);
          return (
            <div key={i} style={{ ...glass, borderRadius: 22, display: "flex", alignItems: "center", gap: 18, padding: "16px 28px 16px 18px", opacity: clamp01(p * 1.5), transform: `translateX(${(1 - p) * -80}px)` }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: accent, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${tick})` }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="24" strokeDashoffset={24 * (1 - clamp01(tick))} />
                </svg>
              </div>
              <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 40, color: "#111", letterSpacing: -0.6 }}>{it}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── CHAT: typing dots, then the bubble ───────────────────────────────────────
export const Chat: React.FC<P<"chat">> = ({ fx, accent, len }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 14, 180);
  const o = envelope(f, 0, len, 2, 7);
  const typing = f < 12;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: 80, right: 160, top: 1180, display: "flex", gap: 18, alignItems: "flex-end", transform: `translateY(${(1 - p) * 70}px) scale(${0.9 + 0.1 * p})`, transformOrigin: "0% 100%" }}>
        <div style={{ width: 76, height: 76, borderRadius: 99, flex: "none", background: `linear-gradient(135deg, ${accent}, #111)`, boxShadow: "0 10px 30px rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 800, fontSize: 34, color: "#fff" }}>
          {(fx.name ?? "?").slice(0, 1).toUpperCase()}
        </div>
        <div style={{ ...glass, borderRadius: "34px 34px 34px 10px", padding: typing ? "26px 34px" : "22px 32px" }}>
          {fx.name ? <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 24, color: "#888", marginBottom: 4 }}>{fx.name}</div> : null}
          {typing ? (
            <div style={{ display: "flex", gap: 10 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 16, height: 16, borderRadius: 99, background: "#999", transform: `translateY(${Math.sin((f + i * 4) / 3) * -5}px)` }} />
              ))}
            </div>
          ) : (
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 44, color: "#111", letterSpacing: -0.8, lineHeight: 1.2 }}>{fx.text}</div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── PROGRESS: title + segmented bar filling ──────────────────────────────────
export const Progress: React.FC<P<"progress">> = ({ fx, accent, len }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 14, 170);
  const o = envelope(f, 0, len, 2, 7);
  const segs = 5;
  const fill = interpolate(f, [6, Math.max(8, len - 10)], [0, segs], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const done = fill >= segs - 0.01;
  const badge = pop(f, fps, Math.max(8, len - 10), 9, 280);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ ...glass, position: "absolute", left: 110, right: 110, top: 1180, padding: "28px 34px", transform: `translateY(${(1 - p) * 90}px)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 42, color: "#111", letterSpacing: -0.8 }}>{fx.title}</div>
          <div style={{ width: 46, height: 46, borderRadius: 99, background: "#22C55E", transform: `scale(${done ? badge : 0})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          {Array.from({ length: segs }, (_, i) => (
            <div key={i} style={{ flex: 1, height: 22, borderRadius: 99, background: "rgba(0,0,0,.1)", overflow: "hidden" }}>
              <div style={{ width: `${clamp01(fill - i) * 100}%`, height: "100%", background: accent, borderRadius: 99 }} />
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── PARTICLES: a rotating dot globe or dot grid behind the head ──────────────
export const Particles: React.FC<P<"particles">> = ({ fx, face, accent, len, head }) => {
  const f = useCurrentFrame();
  const o = envelope(f, 0, len, 8, 10);
  const h = head(f);
  const cx = h.x, cy = h.top + face.h * 0.45;
  const R = face.w * 1.25;
  const dots: { x: number; y: number; z: number }[] = [];
  if ((fx.shape ?? "globe") === "globe") {
    // fibonacci sphere, spun around Y
    const N = 420, rot = f * 0.03;
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996 + rot;
      dots.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r });
    }
  } else {
    for (let gx = -9; gx <= 9; gx++)
      for (let gy = -12; gy <= 12; gy++) {
        const d = Math.hypot(gx, gy);
        const wave = Math.sin(d * 0.8 - f * 0.25);
        dots.push({ x: gx / 9, y: gy / 9, z: wave });
      }
  }
  const grow = interpolate(f, [0, 14], [0.6, 1], { extrapolateRight: "clamp", easing: ease });
  return (
    <AbsoluteFill style={{ opacity: o * 0.95 }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {dots.map((d, i) => {
          const s = (d.z + 1.4) / 2.4;
          return <circle key={i} cx={cx + d.x * R * grow} cy={cy + d.y * R * grow} r={2 + s * 3.5} fill={i % 7 === 0 ? accent : "#fff"} opacity={0.15 + s * 0.75} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ── CHART: a line chart drawing itself on a dark card ────────────────────────
export const Chart: React.FC<P<"chart">> = ({ fx, accent, len }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 15, 150);
  const o = envelope(f, 0, len, 3, 7);
  const draw = interpolate(f, [4, Math.max(6, len * 0.7)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const up = (fx.trend ?? "up") === "up";
  const pts = Array.from({ length: 12 }, (_, i) => {
    const t = i / 11;
    const base = up ? 1 - t : t;
    return [60 + t * 780, 80 + base * 420 + Math.sin(i * 1.9) * 40];
  });
  const d = pts.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" ");
  const L = 1300;
  const tip = pts[Math.min(11, Math.floor(draw * 11))];
  return (
    <AbsoluteFill style={{ opacity: o, alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 900, height: 700, borderRadius: 40, background: "linear-gradient(160deg, rgba(25,28,40,.94), rgba(8,9,14,.96))", boxShadow: "0 40px 100px rgba(0,0,0,.6), inset 0 0 0 1.5px rgba(255,255,255,.12)", transform: `scale(${0.85 + 0.15 * p}) translateY(${(1 - p) * 120}px)`, overflow: "hidden" }}>
        {fx.label ? <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 64, color: "#fff", padding: "36px 46px 0" }}>{fx.label}</div> : null}
        <svg width={900} height={560} viewBox="0 0 900 560">
          <defs>
            <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={accent} stopOpacity={0.45} />
              <stop offset="1" stopColor={accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1="60" x2="840" y1={110 + i * 120} y2={110 + i * 120} stroke="rgba(255,255,255,.08)" strokeWidth="2" />
          ))}
          <path d={`${d} L840 560 L60 560 Z`} fill="url(#chart-fill)" opacity={draw} />
          <path d={d} fill="none" stroke={accent} strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={`${L * draw} ${L}`} style={{ filter: `drop-shadow(0 0 12px ${accent})` }} />
          <circle cx={tip[0]} cy={tip[1]} r="13" fill="#fff" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ── SERIF CAPTIONS: the phrase slides up word by word, the key word in serif italic ─
const clean = (w: string) => w.replace(/[.,!?…:;]+$/, "");

export function phrases(words: Word[]) {
  const out: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    const prev = cur[cur.length - 1];
    if (cur.length && (cur.length >= 4 || w.s - prev.e > 0.4 || /[.,!?…:;]$/.test(prev.w))) {
      out.push(cur);
      cur = [];
    }
    cur.push(w);
  }
  if (cur.length) out.push(cur);
  return out;
}

// the longest word of a phrase carries the emphasis
export const keyIndex = (ph: Word[]) => ph.reduce((b, w, i) => (clean(w.w).length > clean(ph[b].w).length ? i : b), 0);

export const SerifCaptions: React.FC<{ words: Word[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const all = phrases(words);
  const idx = all.findIndex((c, i) => t >= c[0].s - 0.05 && t < (all[i + 1]?.[0].s ?? c[c.length - 1].e + 0.7) - 0.05);
  if (idx < 0) return null;
  const ph = all[idx];
  const k = keyIndex(ph);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 290 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline", columnGap: 16, maxWidth: 940 }}>
        {ph.map((w, i) => {
          const p = pop(frame, fps, Math.round(w.s * fps) - 2, 15, 210);
          const em = i === k;
          return (
            <span
              key={i}
              style={{
                fontFamily: em ? SERIF : SANS,
                fontStyle: em ? "italic" : "normal",
                fontWeight: em ? 700 : 500,
                fontSize: em ? 96 : 64,
                letterSpacing: em ? -1 : -1.5,
                color: "#fff",
                opacity: clamp01(p * 1.4),
                filter: `blur(${(1 - clamp01(p)) * 10}px)`,
                transform: `translateY(${(1 - p) * 40}px)`,
                display: "inline-block",
                textShadow: "0 4px 26px rgba(0,0,0,.5)",
              }}
            >
              {clean(w.w)}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── TITLE: full-screen interstitial (перебивка) — pleated curtain, diagonal glass light,
//    small kicker + metal condensed word, a glowing dot or a dotted path with serif labels ─
const METAL = "linear-gradient(180deg, #ffffff 0%, #dfe3e9 36%, #858b95 52%, #eef0f3 70%, #a3a9b1 100%)";

export const Title: React.FC<P<"title">> = ({ fx, accent, len }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inP = interpolate(f, [0, 6], [1, 0], { extrapolateRight: "clamp", easing: ease });
  const outP = interpolate(f, [len - 5, len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const p = pop(f, fps, 2, 14, 140);
  // split a long word list into two lines, like "NUANCED / NOW"
  const words = fx.text.toUpperCase().split(/\s+/);
  const lines = words.length > 1 && fx.text.length > 9 ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")] : [words.join(" ")];
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.min(260, Math.round(940 / (Math.max(4, longest) * 0.6)));
  const dot = accent;
  const sweep = interpolate(f, [0, len], [-8, 8]);
  return (
    <AbsoluteFill style={{ transform: `translateX(${(inP - outP) * 1080}px)`, filter: `blur(${(inP + outP) * 30}px)` }}>
      <AbsoluteFill style={{ background: fx.bg ?? "#0b0c0f" }} />
      <AbsoluteFill style={{ background: "repeating-linear-gradient(90deg, rgba(255,255,255,0) 0px, rgba(255,255,255,.07) 10px, rgba(0,0,0,.5) 24px, rgba(255,255,255,.03) 32px)" }} />
      {/* diagonal glass light */}
      <AbsoluteFill style={{ background: "linear-gradient(118deg, transparent 52%, rgba(255,255,255,.13) 52.2%, rgba(255,255,255,.05) 75%, transparent 100%)", transform: `translateX(${sweep}%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 45% at 50% 38%, rgba(255,255,255,.08), transparent 70%)" }} />
      <div style={{ position: "absolute", top: 520, width: "100%", textAlign: "center" }}>
        {fx.kicker ? (
          <div
            style={
              fx.kickerStyle === "serif"
                ? { fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 90, color: "#f0f0f3", marginBottom: -10, opacity: clamp01((f - 2) / 6) }
                : { fontFamily: SANS, fontWeight: 700, fontSize: 40, letterSpacing: 1, color: "#f0f0f3", marginBottom: 14, opacity: clamp01((f - 2) / 6) }
            }
          >
            {fx.kickerStyle === "serif" ? fx.kicker : fx.kicker.toUpperCase()}
          </div>
        ) : null}
        {lines.map((l, i) => (
          <div
            key={i}
            style={{
              fontFamily: COND,
              fontWeight: 600,
              fontSize: size,
              lineHeight: 0.92,
              whiteSpace: "nowrap",
              background: METAL,
              WebkitBackgroundClip: "text",
              color: "transparent",
              filter: "drop-shadow(0 10px 30px rgba(0,0,0,.6))",
              opacity: clamp01(pop(f, fps, 3 + i * 3, 14, 150) * 1.4),
              transform: `translateY(${(1 - pop(f, fps, 3 + i * 3, 14, 150)) * 60}px) scale(${0.94 + 0.06 * p})`,
            }}
          >
            {l}
          </div>
        ))}
      </div>
      {fx.path?.length ? (
        // dotted path with labelled nodes, drawn top → bottom
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          {(() => {
            const n = fx.path!.length;
            const pts = fx.path!.map((_, i) => [620 - Math.sin(i * 1.3) * 140, 1060 + (i * 520) / Math.max(1, n - 1)]);
            const d = pts.map((q, i) => (i ? `S ${q[0] + 120} ${q[1] - 160} ${q[0]} ${q[1]}` : `M ${q[0]} ${q[1]}`)).join(" ");
            const draw = interpolate(f, [4, Math.max(6, len * 0.75)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <>
                <path d={d} fill="none" stroke={dot} strokeWidth="4" strokeDasharray="10 12" opacity={0.9} strokeDashoffset={-f * 2} style={{ clipPath: `inset(0 0 ${(1 - draw) * 100}% 0)` }} />
                {pts.map((q, i) => {
                  const k = pop(f, fps, 4 + (i * (len * 0.7)) / n, 10, 220);
                  return (
                    <g key={i} opacity={clamp01(k)}>
                      <circle cx={q[0]} cy={q[1]} r={30 * k} fill={dot} style={{ filter: `drop-shadow(0 0 22px ${dot})` }} />
                      <text x={q[0] - 50} y={q[1] + 18} textAnchor="end" fontFamily={SERIF} fontStyle="italic" fontSize="58" fill="#e8e8ec">
                        {fx.path![i]}
                      </text>
                    </g>
                  );
                })}
              </>
            );
          })()}
        </svg>
      ) : (
        <div style={{ position: "absolute", left: 528, top: 1480, width: 24, height: 24, borderRadius: 99, background: dot, boxShadow: `0 0 30px 8px ${dot}`, opacity: 0.6 + 0.4 * Math.sin(f / 4) }} />
      )}
    </AbsoluteFill>
  );
};

// ── WORD CAPTIONS: one huge condensed word at a time; long words take the accent ─
export const WordCaptions: React.FC<{ words: Word[]; accent: string }> = ({ words, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const i = words.findIndex((w, j) => t >= w.s - 0.04 && t < (words[j + 1]?.s ?? w.e + 0.5) - 0.04);
  if (i < 0) return null;
  const w = clean(words[i].w).toUpperCase();
  const p = pop(frame, fps, Math.round(words[i].s * fps) - 1, 10, 320);
  const key = w.length >= 6;
  const size = Math.min(190, Math.round(960 / (Math.max(3, w.length) * 0.6)));
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 300 }}>
      <div
        style={{
          fontFamily: COND,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1,
          color: key ? accent : "#fff",
          WebkitTextStroke: "3px rgba(0,0,0,.85)",
          paintOrder: "stroke fill",
          textShadow: "0 8px 0 rgba(0,0,0,.55), 0 14px 40px rgba(0,0,0,.5)",
          transform: `scale(${0.6 + 0.4 * p}) rotate(${(1 - p) * -6}deg)`,
          opacity: clamp01(p * 2),
          whiteSpace: "nowrap",
        }}
      >
        {w}
      </div>
    </AbsoluteFill>
  );
};

// ── CLEAN CAPTIONS: one readable line on a soft dark strip, the spoken word underlined ─
export const CleanCaptions: React.FC<{ words: Word[]; accent: string }> = ({ words, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const all = phrases(words);
  const idx = all.findIndex((c, i) => t >= c[0].s - 0.05 && t < (all[i + 1]?.[0].s ?? c[c.length - 1].e + 0.8) - 0.05);
  if (idx < 0) return null;
  const ph = all[idx];
  const o = clamp01((frame - (ph[0].s * fps - 3)) / 5);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 280 }}>
      <div style={{ maxWidth: 940, padding: "18px 30px", borderRadius: 20, background: "rgba(0,0,0,.42)", backdropFilter: "blur(10px)", opacity: o, display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 14, rowGap: 6 }}>
        {ph.map((w, i) => {
          const now = t >= w.s - 0.03 && t < w.e + 0.05;
          const u = now ? clamp01((t - w.s + 0.03) / Math.max(0.08, w.e - w.s)) : t >= w.e ? 1 : 0;
          return (
            <span key={i} style={{ position: "relative", fontFamily: SANS, fontWeight: 600, fontSize: 54, letterSpacing: -0.8, color: "#fff" }}>
              {clean(w.w)}
              <span style={{ position: "absolute", left: 0, bottom: -4, height: 5, borderRadius: 3, width: `${(now ? u : 0) * 100}%`, background: accent }} />
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
