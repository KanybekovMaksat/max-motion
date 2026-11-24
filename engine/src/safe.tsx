// Safe zones: where Instagram / TikTok / Shorts draw their UI over a 1080×1920 reel.
// Captions and front cards live inside the zone of `edit.platform` (default "all", the union),
// and the preview overlay (`mm still … --safe`, `mm render … --safe`) draws the app UI on top.
import React, { createContext, useContext } from "react";
import { AbsoluteFill } from "remotion";
import { SANS } from "./fonts";
import { captionTop } from "./layout";
import ZONES from "./safe-zones.json";

export type Platform = "reels" | "tiktok" | "shorts" | "all";
export type Zone = { label: string; top: number; bottom: number; left: number; right: number; rail: { x: number; top: number; bottom: number } };

export const PLATFORMS: Platform[] = ["reels", "tiktok", "shorts", "all"];
export const zoneOf = (p?: string): Zone => (ZONES as unknown as Record<string, Zone>)[p && p in ZONES ? p : "all"];

// the caption band and the line graphics stop at (layout.ts)
export { CAPTION_H, CAPTION_LIFT, captionTop } from "./layout";

const SafeCtx = createContext<{ zone: Zone; captions: boolean }>({ zone: zoneOf("all"), captions: true });
export const SafeProvider = SafeCtx.Provider;
export const useSafe = () => useContext(SafeCtx).zone;
// the lowest y a graphic may reach
export const useKeepOut = () => {
  const { zone, captions } = useContext(SafeCtx);
  return captionTop(zone, captions);
};

// the lower-third slot for one front card (card, counter, checklist, chat, progress, search, quote):
// inside the side margins, bottom edge just above the caption band
export function useSlot() {
  const { zone, captions } = useContext(SafeCtx);
  return { left: zone.left + 30, right: zone.right + 20, bottom: 1920 - captionTop(zone, captions) };
}

// ── preview overlay: dead areas tinted, safe box dashed, a mock of the app UI ──
const ink = "rgba(255,255,255,.96)";
const shade = "rgba(255,40,70,.22)";

const Icon: React.FC<{ d: string; size?: number; fill?: boolean }> = ({ d, size = 64, fill }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? ink : "none"} stroke={ink} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,.5))" }}>
    <path d={d} />
  </svg>
);
const HEART = "M12 21s-7.5-4.6-9.5-9.3C1.2 8.5 3.3 5 6.8 5c2.1 0 3.6 1.2 5.2 3 1.6-1.8 3.1-3 5.2-3 3.5 0 5.6 3.5 4.3 6.7C19.5 16.4 12 21 12 21z";
const BUBBLE = "M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5A8.5 8.5 0 1 1 21 12z";
const SEND = "M22 3 11 13M22 3l-7 18-4-8-8-4 19-6z";
const SHARE = "M14 4l7 7-7 7v-4c-6 0-9 2-11 6 1-7 4-11 11-12V4z";
const SAVE = "M6 3h12v18l-6-4-6 4V3z";
const DOTS = "M5 12h.01M12 12h.01M19 12h.01";

const Rail: React.FC<{ p: Platform; z: Zone }> = ({ p, z }) => {
  const items: [string, string][] =
    p === "tiktok"
      ? [[HEART, "128K"], [BUBBLE, "1 204"], [SAVE, "9 870"], [SHARE, "3 311"]]
      : p === "shorts"
        ? [[HEART, "128K"], [BUBBLE, "1 204"], [SHARE, "Share"], [DOTS, ""]]
        : [[HEART, "128K"], [BUBBLE, "1 204"], [SEND, "3 311"], [DOTS, ""]];
  const gap = (z.rail.bottom - z.rail.top - 120) / items.length;
  return (
    <div style={{ position: "absolute", left: z.rail.x, right: 0, top: z.rail.top, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {p === "tiktok" ? <div style={{ width: 96, height: 96, borderRadius: 99, background: "#bbb", border: "3px solid #fff", marginBottom: 40 }} /> : null}
      {items.map(([d, n], i) => (
        <div key={i} style={{ height: gap, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Icon d={d} fill={p === "tiktok" && i === 0} />
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 26, color: ink, marginTop: 6, textShadow: "0 1px 4px rgba(0,0,0,.6)" }}>{n}</div>
        </div>
      ))}
      <div style={{ width: 64, height: 64, borderRadius: p === "tiktok" ? 99 : 14, background: "linear-gradient(135deg,#555,#222)", border: "3px solid #fff" }} />
    </div>
  );
};

export const SafeOverlay: React.FC<{ platform: Platform }> = ({ platform }) => {
  const z = zoneOf(platform);
  const ui: Platform = platform === "all" ? "reels" : platform;
  const H = 1920, W = 1080;
  const text = (s: number, w = 600): React.CSSProperties => ({ fontFamily: SANS, fontWeight: w, fontSize: s, color: ink, textShadow: "0 1px 6px rgba(0,0,0,.6)", whiteSpace: "nowrap" });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* covered areas */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: z.top, background: shade }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: z.bottom, background: shade }} />
      <div style={{ position: "absolute", left: 0, width: z.left, top: z.top, bottom: z.bottom, background: shade }} />
      <div style={{ position: "absolute", left: W - z.right, right: 0, top: z.top, bottom: z.bottom, background: shade }} />
      <div style={{ position: "absolute", left: z.rail.x, right: z.right, top: Math.max(z.top, z.rail.top), height: Math.max(0, Math.min(H - z.bottom, z.rail.bottom) - Math.max(z.top, z.rail.top)), background: shade }} />
      {/* safe box */}
      <div style={{ position: "absolute", left: z.left, right: z.right, top: z.top, bottom: z.bottom, border: "4px dashed rgba(80,255,140,.95)", borderRadius: 8 }} />
      <div style={{ position: "absolute", left: z.left + 14, top: z.top + 10, ...text(26, 700), color: "rgba(80,255,140,1)" }}>
        SAFE · {z.label} · {W - z.left - z.right}×{H - z.top - z.bottom}
      </div>
      {/* top bar */}
      <div style={{ position: "absolute", left: 44, right: 44, top: 70, display: "flex", justifyContent: ui === "tiktok" ? "center" : "space-between", alignItems: "center", gap: 40 }}>
        {ui === "tiktok" ? (
          <>
            <span style={{ ...text(38, 600), opacity: 0.7 }}>Following</span>
            <span style={{ ...text(38, 800), borderBottom: "4px solid #fff", paddingBottom: 6 }}>For You</span>
          </>
        ) : (
          <>
            <span style={text(54, 800)}>{ui === "shorts" ? "Shorts" : "Reels"}</span>
            <Icon d={ui === "shorts" ? "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm10 17-5-5" : "M3 8h4l2-3h6l2 3h4v12H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"} size={58} />
          </>
        )}
      </div>
      <Rail p={ui} z={z} />
      {/* bottom: account, caption, sound, progress */}
      <div style={{ position: "absolute", left: z.left, right: z.right + 30, bottom: ui === "tiktok" ? 180 : 120, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {ui !== "tiktok" ? <div style={{ width: 72, height: 72, borderRadius: 99, background: "#bbb", border: "3px solid #fff" }} /> : null}
          <span style={text(36, 700)}>{ui === "tiktok" ? "@maksat.up" : "maksat.up"}</span>
          {ui !== "tiktok" ? <span style={{ ...text(30, 700), border: "2px solid rgba(255,255,255,.8)", borderRadius: 14, padding: "6px 18px" }}>{ui === "shorts" ? "Subscribe" : "Follow"}</span> : null}
        </div>
        <div style={{ ...text(32, 500), whiteSpace: "normal", lineHeight: 1.35 }}>Описание ролика в две строки, хэштеги и ссылка на курс… ещё</div>
        <div style={text(28, 500)}>♫ Original audio · maksat.up</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: ui === "tiktok" ? 150 : 40, height: 5, background: "rgba(255,255,255,.35)" }}>
        <div style={{ width: "38%", height: "100%", background: "#fff" }} />
      </div>
      {ui === "tiktok" ? (
        // TikTok's tab bar
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 150, background: "rgba(0,0,0,.92)", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          {["Home", "Friends", "+", "Inbox", "Profile"].map((t) => (
            <span key={t} style={t === "+" ? { ...text(44, 800), background: "#fff", color: "#000", borderRadius: 16, padding: "0 30px", textShadow: "none" } : text(24, 600)}>{t}</span>
          ))}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// Template PNG of one platform (no video under it), exported by `mm safezones`.
export const SafeTemplate: React.FC<{ platform: Platform }> = ({ platform }) => <SafeOverlay platform={platform} />;
