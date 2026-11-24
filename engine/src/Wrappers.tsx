// The two other wrappers @eightsenses.media posts around a finished edit:
//   ClaudeChat   — a Claude window: raw clip sent with the skill chip → "Here is your reel ✓" + ticking checklist → Download → Saved
//   PromptResult — "I DIDN'T EDIT THIS": Claude Code typing the prompt and steps on the left, the result phone on the right
import React from "react";
import { AbsoluteFill, CalculateMetadataFunction, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COND, SANS, SERIF } from "./fonts";
import { Curtain } from "./Showcase";
import { clamp01, ease, pop } from "./time";
import type { Meta } from "./types";

export type WrapperProps = {
  slug: string;
  handle: string;
  comment: string; // the hater comment
  skill: string; // chip on the message, e.g. "max-motion"
  prompt: string; // what the user typed
  steps: string[]; // checklist that ticks while the reel plays
  title: string; // PromptResult headline
  sub: string; // PromptResult serif line
  tint: string;
};

export const calcWrapper: CalculateMetadataFunction<WrapperProps> = async ({ props }) => {
  const meta: Meta = await (await fetch(staticFile(`${props.slug}/meta.json`))).json();
  return { durationInFrames: Math.floor(meta.duration * meta.fps), fps: meta.fps, width: 1080, height: 1920 };
};

const ORANGE = "#D97757";

// Oswald caps ≈ 0.5em per glyph: shrink a headline until it fits in ~980px on one line
export const fitCond = (text: string, max: number) => Math.min(max, Math.round(980 / (Math.max(4, text.length) * 0.58)));
const Spark: React.FC<{ size: number }> = ({ size }) => <span style={{ color: ORANGE, fontSize: size, lineHeight: 1 }}>✳</span>;

const Comment: React.FC<{ handle: string; text: string; top: number }> = ({ handle, text, top }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 14, 170);
  return (
    <div style={{ position: "absolute", top, width: "100%", display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * -30}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#fff", borderRadius: 99, padding: "12px 36px 12px 14px", boxShadow: "0 12px 40px rgba(0,0,0,.45)" }}>
        <div style={{ width: 54, height: 54, borderRadius: 99, background: "linear-gradient(135deg,#c9c9c9,#8b8b8b)" }} />
        <div style={{ fontFamily: SANS, lineHeight: 1.15 }}>
          <div style={{ fontSize: 21, color: "#888" }}>{handle}</div>
          <div style={{ fontSize: 33, fontWeight: 700, color: "#111", letterSpacing: -0.6, display: "flex", gap: 8, alignItems: "center" }}>
            <Spark size={30} /> {text}
          </div>
        </div>
      </div>
    </div>
  );
};

// step i ticks at an even share of the clip, leaving the last 20% for the Download click
const stepAt = (i: number, n: number, total: number) => Math.round(8 + (i * (total * 0.72 - 8)) / Math.max(1, n));

export const ClaudeChat: React.FC<WrapperProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames: D } = useVideoConfig();
  const win = pop(f, fps, 2, 16, 140);
  const clickAt = Math.round(D * 0.8);
  const saved = f >= clickAt + 3;
  // cursor glides to the button, presses, stays
  const cur = interpolate(f, [clickAt - 16, clickAt], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const press = f >= clickAt && f < clickAt + 4 ? 0.94 : 1;
  const panel: React.CSSProperties = { background: "#242426", borderRadius: 26, boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.06)" };
  return (
    <AbsoluteFill>
      <Curtain tint={p.tint} />
      <Comment handle={p.handle} text={p.comment} top={150} />
      <div
        style={{
          position: "absolute", left: 50, right: 50, top: 300, bottom: 110, borderRadius: 40, background: "#1b1b1d",
          boxShadow: "0 50px 120px rgba(0,0,0,.65), inset 0 0 0 1.5px rgba(255,255,255,.08)", padding: "30px 34px",
          opacity: win, transform: `translateY(${(1 - win) * 80}px) scale(${0.96 + 0.04 * win})`,
        }}
      >
        {/* window header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: SANS }}>
          <Spark size={40} />
          <div style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 40, color: "#f2f2f2" }}>Claude</div>
          <div style={{ fontSize: 26, color: "#8a8a8e", marginLeft: 8 }}>Edit my reel</div>
          <div style={{ marginLeft: "auto", color: "#8a8a8e", fontSize: 30, letterSpacing: 4 }}>⤴ ···</div>
        </div>
        {/* user message */}
        <div style={{ ...panel, marginLeft: 170, marginTop: 26, padding: 18, display: "flex", gap: 24 }}>
          <div style={{ width: 150, height: 266, borderRadius: 16, overflow: "hidden", flex: "none", boxShadow: "0 0 0 2px rgba(255,255,255,.15)" }}>
            <OffthreadVideo src={staticFile(`${p.slug}/base.mp4`)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ fontFamily: SANS, paddingTop: 6 }}>
            <div style={{ fontSize: 26, color: "#e8e8ea", fontWeight: 600 }}>
              raw.mp4 <span style={{ color: "#8a8a8e", fontWeight: 400 }}>· {Math.round(D / fps)} s</span>
            </div>
            <div style={{ display: "inline-flex", gap: 8, alignItems: "center", marginTop: 14, padding: "8px 16px", borderRadius: 10, background: "rgba(217,119,87,.16)", color: "#F0B39C", fontSize: 25, fontWeight: 600 }}>
              <Spark size={22} /> {p.skill}
            </div>
            <div style={{ fontSize: 34, color: "#f2f2f2", marginTop: 18 }}>{p.prompt}</div>
            <div style={{ fontSize: 21, color: "#6f6f74", marginTop: 34 }}>sent · just now</div>
          </div>
        </div>
        {/* reply */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 28, fontFamily: SANS, fontSize: 32, color: "#f2f2f2", opacity: clamp01((f - 6) / 6) }}>
          <Spark size={30} /> Here is your reel <span style={{ color: "#4ADE80" }}>✓</span>
        </div>
        <div style={{ ...panel, marginTop: 18, padding: 16, display: "flex", gap: 22, height: 1000 }}>
          <div style={{ width: 540, height: 960, borderRadius: 22, overflow: "hidden", flex: "none", boxShadow: "0 0 0 2px rgba(255,255,255,.12)" }}>
            <OffthreadVideo src={staticFile(`${p.slug}/after.mp4`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", fontFamily: SANS, paddingTop: 8 }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#f2f2f2" }}>reel.mp4</div>
            <div style={{ fontSize: 22, color: "#8a8a8e", marginBottom: 18 }}>1080×1920 · {Math.round(D / fps)} s</div>
            {p.steps.map((s, i) => {
              const k = pop(f, fps, stepAt(i, p.steps.length, D), 14, 220);
              return (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 14px", marginBottom: 12, borderRadius: 12, background: "rgba(217,119,87,.10)", boxShadow: "inset 0 0 0 1.5px rgba(217,119,87,.35)", opacity: clamp01(k * 1.5), transform: `translateX(${(1 - k) * 30}px)` }}>
                  <span style={{ color: ORANGE, fontSize: 22, fontWeight: 800 }}>✓</span>
                  <span style={{ fontSize: 23, fontWeight: 600, color: "#ececee", letterSpacing: -0.2 }}>{s}</span>
                </div>
              );
            })}
            <div style={{ marginTop: "auto", position: "relative" }}>
              <div style={{ height: 76, borderRadius: 14, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 28, fontWeight: 700, color: "#111", transform: `scale(${press})` }}>
                {saved ? "✓ Saved" : "↓ Download"}
              </div>
              {/* cursor */}
              <svg width="44" height="44" viewBox="0 0 24 24" style={{ position: "absolute", left: interpolate(cur, [0, 1], [260, 150]), top: interpolate(cur, [0, 1], [-260, 30]), opacity: f > clickAt - 18 ? 1 : 0 }}>
                <path d="M4 2l15 11-7 1 4 8-3 1-4-8-5 5z" fill="#fff" stroke="#000" strokeWidth="1.3" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const PromptResult: React.FC<WrapperProps> = (p) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames: D } = useVideoConfig();
  const inn = (d: number) => pop(f, fps, d, 15, 150);
  const metal = "linear-gradient(180deg, #ffffff 0%, #d9dde4 38%, #7d838d 52%, #e9ecf0 70%, #9aa0a8 100%)";
  const line = `> ${p.prompt}`;
  const typed = line.slice(0, Math.floor(clamp01((f - 4) / 22) * line.length));
  const stepsStart = 28;
  const per = Math.max(6, Math.floor((D * 0.85 - stepsStart) / Math.max(1, p.steps.length)));
  const done = Math.max(0, Math.min(p.steps.length, Math.floor((f - stepsStart) / per) + 1));
  const progress = clamp01((f - stepsStart) / (D * 0.85 - stepsStart));
  return (
    <AbsoluteFill style={{ background: "#08090b" }}>
      {/* fine grid backdrop */}
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)", backgroundSize: "54px 54px" }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 40% at 50% 55%, ${p.tint}40, transparent 70%)` }} />
      <Comment handle={p.handle} text={p.comment} top={150} />
      <div style={{ position: "absolute", top: 290, width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: COND, fontWeight: 700, fontSize: fitCond(p.title, 170), lineHeight: 1, whiteSpace: "nowrap", background: metal, WebkitBackgroundClip: "text", color: "transparent", opacity: inn(3), transform: `scale(${0.92 + 0.08 * inn(3)})` }}>{p.title}</div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: Math.min(64, Math.round(1900 / Math.max(20, p.sub.length))), whiteSpace: "nowrap", color: "#ececf0", marginTop: 4, opacity: clamp01((f - 8) / 8) }}>{p.sub}</div>
      </div>
      {/* THE PROMPT */}
      <div style={{ position: "absolute", left: 50, top: 650, width: 480, transform: `perspective(1600px) rotateY(12deg) translateX(${(1 - inn(6)) * -300}px)`, transformOrigin: "100% 50%" }}>
        <div style={{ display: "inline-block", marginLeft: 120, marginBottom: 16, fontFamily: SANS, fontWeight: 800, fontSize: 28, color: "#fff", background: "#1c1d21", borderRadius: 14, padding: "10px 20px", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.18)" }}>THE PROMPT</div>
        <div style={{ height: 900, borderRadius: 30, background: "#16171a", boxShadow: "0 40px 90px rgba(0,0,0,.6), inset 0 0 0 1.5px rgba(255,255,255,.08)", padding: "22px 26px", fontFamily: "Menlo, monospace" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#b9b9be", fontSize: 24, marginBottom: 30 }}>
            {["#55565c", "#55565c", "#55565c"].map((c, i) => <div key={i} style={{ width: 13, height: 13, borderRadius: 99, background: c }} />)}
            <span style={{ marginLeft: 12 }}><Spark size={22} /> Claude Code</span>
          </div>
          <div style={{ color: "#fff", fontSize: 28, fontWeight: 700, lineHeight: 1.45, minHeight: 120 }}>
            {typed}
            <span style={{ opacity: Math.floor(f / 8) % 2 ? 0 : 1 }}>▍</span>
          </div>
          <div style={{ marginTop: 30 }}>
            {p.steps.map((s, i) => (
              <div key={i} style={{ color: i < done - 1 || progress >= 1 ? "#e6e6ea" : "#8b8b90", fontSize: 25, marginBottom: 16, opacity: i < done ? 1 : 0 }}>
                {i < done - 1 || progress >= 1 ? "✓" : "·"} {s}
              </div>
            ))}
          </div>
          <div style={{ color: "#8b8b90", fontSize: 25, marginTop: 40, opacity: progress < 1 ? 1 : 0 }}>{"⠋⠙⠹⠸⠼⠴⠦⠧"[Math.floor(f / 3) % 8]} working…</div>
        </div>
      </div>
      {/* RESULT */}
      <div style={{ position: "absolute", right: 50, top: 600, width: 500, transform: `perspective(1600px) rotateY(-10deg) translateX(${(1 - inn(9)) * 300}px)`, transformOrigin: "0% 50%" }}>
        <div style={{ display: "inline-flex", gap: 8, alignItems: "center", marginLeft: 220, marginBottom: 16, fontFamily: SANS, fontWeight: 800, fontSize: 28, color: "#fff", background: "#1c1d21", borderRadius: 14, padding: "10px 20px", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.18)" }}>
          <Spark size={24} /> RESULT
        </div>
        <div style={{ height: 900, borderRadius: 54, padding: 14, background: "linear-gradient(145deg,#3a3b40,#121316)", boxShadow: "0 50px 110px rgba(0,0,0,.7), 0 0 0 2px rgba(255,255,255,.12)" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 42, overflow: "hidden" }}>
            <OffthreadVideo src={staticFile(`${p.slug}/after.mp4`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
      </div>
      {/* step progress */}
      <div style={{ position: "absolute", left: 220, right: 220, top: 1640 }}>
        <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,.15)" }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", borderRadius: 99, background: "#fff" }} />
        </div>
        <div style={{ textAlign: "center", marginTop: 22, fontFamily: SANS, fontWeight: 600, fontSize: 32, color: "#d8d8dc" }}>
          {done === 0 ? "Typing the request" : `Step ${Math.min(done, p.steps.length)} of ${p.steps.length}`}
        </div>
      </div>
    </AbsoluteFill>
  );
};
