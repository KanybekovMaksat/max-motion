import React from "react";

// Flat app glyphs for the orbit effect. Each is drawn in a 100x100 box.
const glyphs: Record<string, { bg: string; body: React.ReactNode }> = {
  instagram: {
    bg: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
    body: (
      <>
        <rect x="24" y="24" width="52" height="52" rx="15" fill="none" stroke="#fff" strokeWidth="7" />
        <circle cx="50" cy="50" r="12" fill="none" stroke="#fff" strokeWidth="7" />
        <circle cx="66" cy="34" r="4" fill="#fff" />
      </>
    ),
  },
  tiktok: {
    bg: "#000",
    body: (
      <path
        d="M56 22h11c1 8 6 14 14 15v11c-6 0-11-2-14-4v22c0 11-9 19-19 19s-19-8-19-19 9-19 19-19c1 0 3 0 4 1v11c-1-1-2-1-4-1-5 0-8 4-8 8s4 8 8 8 9-3 9-9z"
        fill="#fff"
        style={{ filter: "drop-shadow(-2.5px -2px 0 #25F4EE) drop-shadow(2.5px 2px 0 #FE2C55)" }}
      />
    ),
  },
  youtube: {
    bg: "#fff",
    body: (
      <>
        <rect x="16" y="28" width="68" height="46" rx="13" fill="#FF0000" />
        <path d="M44 40l18 11-18 11z" fill="#fff" />
      </>
    ),
  },
  telegram: {
    bg: "linear-gradient(#37AEE2, #1E96C8)",
    body: <path d="M22 49l52-20c3-1 5 1 4 5l-9 41c-1 3-3 4-6 2l-14-10-7 7c-1 1-2 1-3 0l1-12 25-23-31 19-13-4c-3-1-3-3 1-5z" fill="#fff" />,
  },
  whatsapp: {
    bg: "#25D366",
    body: (
      <>
        <path d="M50 20a30 30 0 0 0-26 45l-4 15 16-4a30 30 0 1 0 14-56z" fill="none" stroke="#fff" strokeWidth="6" />
        <path d="M40 36c2 0 3 5 3 6s-3 3-2 5c2 4 6 8 10 10 2 1 3-2 5-2 1 0 6 2 6 4 0 3-3 6-7 6-9 0-21-12-21-21 0-4 3-8 6-8z" fill="#fff" />
      </>
    ),
  },
  claude: {
    bg: "#F5F0E8",
    body: (
      <g transform="translate(50 50)" fill="#D97757">
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x="-3.5" y="-30" width="7" height="27" rx="3.5" transform={`rotate(${i * 30 + (i % 2) * 6})`} />
        ))}
      </g>
    ),
  },
  python: {
    bg: "#fff",
    body: (
      <>
        <path d="M49 18c-16 0-15 7-15 7v8h16v3H27s-10-1-10 15 9 15 9 15h5v-8s0-9 9-9h16s8 0 8-8V26s1-8-15-8zm-9 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" fill="#3776AB" />
        <path d="M51 82c16 0 15-7 15-7v-8H50v-3h23s10 1 10-15-9-15-9-15h-5v8s0 9-9 9H44s-8 0-8 8v15s-1 8 15 8zm9-5a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" fill="#FFD43B" />
      </>
    ),
  },
  js: {
    bg: "#F7DF1E",
    body: (
      <text x="80" y="82" textAnchor="end" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="40" fill="#000">
        JS
      </text>
    ),
  },
};

export const ICONS = Object.keys(glyphs);

export const AppIcon: React.FC<{ name: string; size: number }> = ({ name, size }) => {
  const g = glyphs[name] ?? glyphs.claude;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        background: g.bg,
        boxShadow: "0 18px 40px rgba(0,0,0,.35), inset 0 0 0 1.5px rgba(255,255,255,.25)",
        overflow: "hidden",
      }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {g.body}
      </svg>
    </div>
  );
};
