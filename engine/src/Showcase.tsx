import React from "react";
import { AbsoluteFill, CalculateMetadataFunction, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COND, SANS, SERIF } from "./fonts";
import { fitCond } from "./Wrappers";
import { clamp01, ease, pop } from "./time";
import type { Meta } from "./types";

// The wrapper the reference account posts: hate comment → "Oh my god… CLAUDE edited this?" → raw clip vs finished edit.
export type ShowcaseProps = {
  slug: string;
  comment: string; // the "hater" comment chip
  handle: string;
  kicker: string; // "Oh my god…"
  title: string; // "CLAUDE"
  sub: string; // "edited this?"
  terminal: string[]; // first line is the question, rest are options/checks
  tint: string; // curtain light colour
};

export const calcShowcase: CalculateMetadataFunction<ShowcaseProps> = async ({ props }) => {
  const meta: Meta = await (await fetch(staticFile(`${props.slug}/meta.json`))).json();
  return { durationInFrames: Math.floor(meta.duration * meta.fps), fps: meta.fps, width: 1080, height: 1920 };
};

// Vertical pleated curtain with a slow moving light — the backdrop of every reference reel.
export const Curtain: React.FC<{ tint: string }> = ({ tint }) => {
  const f = useCurrentFrame();
  const lx = 30 + Math.sin(f / 40) * 25;
  return (
    <AbsoluteFill style={{ background: "#05060a" }}>
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(90deg, rgba(255,255,255,.0) 0px, rgba(255,255,255,.10) 9px, rgba(0,0,0,.55) 22px, rgba(255,255,255,.04) 30px)`,
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 45% at ${lx}% 18%, ${tint}aa, transparent 70%)`, mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 40% at ${100 - lx}% 85%, ${tint}77, transparent 70%)`, mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.55), transparent 30%, transparent 70%, rgba(0,0,0,.6))" }} />
    </AbsoluteFill>
  );
};

const Panel: React.FC<{ label: string; children: React.ReactNode; style: React.CSSProperties }> = ({ label, children, style }) => (
  <div style={{ position: "absolute", borderRadius: 34, overflow: "hidden", boxShadow: "0 40px 90px rgba(0,0,0,.6), 0 0 0 2px rgba(255,255,255,.12)", ...style }}>
    {children}
    <div style={{ position: "absolute", top: 18, left: 20, fontFamily: SANS, fontWeight: 800, fontSize: 20, letterSpacing: 1.5, color: "#fff", background: "rgba(0,0,0,.45)", padding: "6px 12px", borderRadius: 10 }}>
      {label}
    </div>
  </div>
);

export const Showcase: React.FC<ShowcaseProps> = (p) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inn = (d: number) => pop(f, fps, d, 15, 150);
  const metal = "linear-gradient(180deg, #ffffff 0%, #d9dde4 38%, #7d838d 52%, #e9ecf0 70%, #9aa0a8 100%)";
  const [question, ...lines] = p.terminal;
  return (
    <AbsoluteFill>
      <Curtain tint={p.tint} />
      {/* comment chip */}
      <div style={{ position: "absolute", top: 210, width: "100%", display: "flex", justifyContent: "center", opacity: inn(0), transform: `translateY(${(1 - inn(0)) * -30}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#fff", borderRadius: 99, padding: "12px 34px 12px 14px", boxShadow: "0 12px 40px rgba(0,0,0,.4)" }}>
          <div style={{ width: 52, height: 52, borderRadius: 99, background: "linear-gradient(135deg,#bbb,#888)" }} />
          <div style={{ fontFamily: SANS, lineHeight: 1.15 }}>
            <div style={{ fontSize: 20, color: "#888" }}>{p.handle} · 2h</div>
            <div style={{ fontSize: 31, fontWeight: 700, color: "#111", letterSpacing: -0.5 }}>{p.comment}</div>
          </div>
        </div>
      </div>
      {/* headline */}
      <div style={{ position: "absolute", top: 305, width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 44, color: "#fff", opacity: clamp01((f - 4) / 8) }}>{p.kicker}</div>
        <div
          style={{
            fontFamily: COND,
            fontWeight: 700,
            fontSize: fitCond(p.title, 250),
            lineHeight: 0.95,
            whiteSpace: "nowrap",
            letterSpacing: 2,
            background: metal,
            WebkitBackgroundClip: "text",
            color: "transparent",
            filter: "drop-shadow(0 10px 30px rgba(0,0,0,.6))",
            transform: `scale(${0.9 + 0.1 * inn(3)})`,
            opacity: inn(3),
          }}
        >
          {p.title}
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 58, color: "#e8e8ee", marginTop: -6, opacity: clamp01((f - 10) / 8) }}>{p.sub}</div>
      </div>
      {/* before / after */}
      <Panel label="BEFORE" style={{ left: 40, top: 860, width: 380, height: 676, transform: `rotate(-4deg) translateX(${(1 - inn(8)) * -400}px)` }}>
        <OffthreadVideo src={staticFile(`${p.slug}/base.mp4`)} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(.75)" }} />
      </Panel>
      <Panel label="AFTER" style={{ right: 40, top: 760, width: 560, height: 996, transform: `translateX(${(1 - inn(6)) * 500}px)` }}>
        <OffthreadVideo src={staticFile(`${p.slug}/after.mp4`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Panel>
      <div style={{ position: "absolute", right: 30, top: 735, fontFamily: SANS, fontWeight: 700, fontSize: 24, color: "#111", background: "#fff", borderRadius: 12, padding: "8px 14px", display: "flex", gap: 8, alignItems: "center", opacity: inn(12) }}>
        <span style={{ color: "#D97757", fontSize: 28 }}>✳</span> Claude Skill
      </div>
      {/* terminal */}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 1560,
          width: 640,
          borderRadius: 22,
          background: "rgba(14,14,18,.94)",
          boxShadow: "0 30px 70px rgba(0,0,0,.6), 0 0 0 1.5px rgba(255,255,255,.1)",
          padding: "20px 26px 26px",
          fontFamily: "Menlo, monospace",
          transform: `translateY(${(1 - inn(14)) * 300}px)`,
        }}
      >
        <div style={{ display: "flex", gap: 9, marginBottom: 16 }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div key={c} style={{ width: 15, height: 15, borderRadius: 99, background: c }} />
          ))}
        </div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 27 }}>{question}</div>
        {lines.map((l, i) => {
          const show = interpolate(f, [22 + i * 9, 26 + i * 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
          return (
            <div key={i} style={{ color: i === 0 ? "#E8916B" : "#cfcfd6", fontSize: 25, marginTop: 8, opacity: show }}>
              {l}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
