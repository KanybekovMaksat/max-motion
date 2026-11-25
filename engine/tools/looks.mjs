// Looks = the art direction of a reel: colours, caption style, word font, how much the camera moves,
// how dense the beats are and which effects carry the story. Pick by the goal of the video
// (pickLook) or by name; plan.mjs turns the look + the transcript into edit.json.

export const LOOKS = {
  // selling a product, a course, a listing: clear, confident, cards with proof
  sell: {
    label: "Продажа / оффер",
    accent: "#3B82F6",
    captionStyle: "mix",
    behindFont: "sans",
    grade: { contrast: 1.1, saturate: 1.05, brightness: 0.98, vignette: 0.55 },
    gap: 1.1, // seconds between beats
    shakeEvery: 3, // every Nth beat shakes instead of a punch (0 = never)
    hookOutline: "neon",
    cycle: ["behind", "pop", "behind", "card", "title", "behind", "checklist", "orbit", "behind", "progress", "broll"],
    sfx: 0.9,
    backdrop: "backlight",
  },
  // personal brand, creator, lifestyle: fresh, light, graphic
  brand: {
    label: "Личный бренд",
    accent: "#B8F02A",
    captionStyle: "mix",
    behindFont: "sans",
    grade: { contrast: 1.04, saturate: 0.92, brightness: 1.04, vignette: 0.35 },
    gap: 1.2,
    shakeEvery: 4,
    hookOutline: "sticker",
    cycle: ["ribbon", "quote", "behind", "film", "search", "behind", "orbit", "title", "pop"],
    sfx: 0.8,
    backdrop: "rays",
  },
  // podcast, interview, expert opinion: dark room, bright person, condensed metal word behind the head,
  // real 3D icons for the things named, one title card at the turn, no UI text cards
  podcast: {
    label: "Подкаст / эксперт",
    accent: "#6E8BFF",
    captionStyle: "mix",
    behindFont: "cond",
    grade: { contrast: 1.1, saturate: 0.95, brightness: 0.96, vignette: 0.6, room: { dim: 0.4, desat: 0.5, blur: 5 } },
    gap: 1.6,
    shakeEvery: 6,
    hookOutline: "rim",
    hookHalo: false,
    cycle: ["sticker", "behind", "sticker", "sticker", "title", "behind", "sticker", "sticker", "behind", "sticker"],
    titles: 1, // at most one перебивка per reel
    avoid: ["chat", "checklist"], // spoken questions and lists stay in the captions
    outro: "behind",
    sfx: 1,
    backdrop: null,
  },
  // news, trends, teens, hot takes: loud, fast, one word at a time
  hype: {
    label: "Новости / хайп",
    accent: "#FF3D57",
    captionStyle: "mix",
    behindFont: "cond",
    grade: { contrast: 1.16, saturate: 1.12, brightness: 0.97, vignette: 0.5 },
    gap: 0.85,
    shakeEvery: 2,
    hookOutline: "neon",
    cycle: ["behind", "orbit", "title", "pop", "behind", "broll", "counter", "behind", "search"],
    sfx: 1,
    backdrop: "backlight",
  },
  // explaining, teaching, talking to parents: calm, readable, few moves
  calm: {
    label: "Обучение / объяснение",
    accent: "#22C55E",
    captionStyle: "clean",
    behindFont: "serif",
    grade: { contrast: 1.03, saturate: 1.0, brightness: 1.03, vignette: 0.3 },
    gap: 1.8,
    shakeEvery: 0,
    hookOutline: "rim",
    cycle: ["behind", "checklist", "quote", "behind", "progress", "title"],
    sfx: 0.5,
    backdrop: null,
  },
  // premium, luxury, big money: gold, slow, serif, light
  luxury: {
    label: "Премиум",
    accent: "#D4AF37",
    captionStyle: "mix",
    behindFont: "serif",
    grade: { contrast: 1.1, saturate: 0.85, brightness: 0.95, vignette: 0.7, room: { dim: 0.2, desat: 0.15, blur: 2 } },
    gap: 1.6,
    shakeEvery: 0,
    hookOutline: "rim",
    cycle: ["behind", "halo", "title", "behind", "card", "rays"],
    sfx: 0.6,
    backdrop: "rays",
  },
};

// words in the brief (goal / description) → look. First match wins, order = priority.
const GOAL_WORDS = [
  ["luxury", /преми|люкс|luxury|premium|элит|vip/i],
  ["hype", /новост|хайп|тренд|news|hype|trend|подрост|teen|тикток|tiktok|вирус|viral/i],
  ["podcast", /подкаст|интервью|эксперт|мнени|podcast|interview|expert|разговор/i],
  ["calm", /обуч|объясн|урок|родител|мам|туториал|инструкц|teach|explain|tutorial|parent|lesson/i],
  ["brand", /бренд|личн|лайфстайл|блог|brand|personal|creator|lifestyle/i],
  ["sell", /прода|оффер|курс|запис|скидк|цена|sale|sell|offer|course|listing|недвиж|realtor/i],
];

export function pickLook(goal = "") {
  for (const [name, re] of GOAL_WORDS) if (re.test(goal)) return name;
  return "sell";
}

// What the speech itself asks for, word by word: numbers → counter, questions → chat,
// enumerations → checklist. plan.mjs swaps these in over the look's cycle.
export function contentKind(words, i) {
  const w = words[i]?.w ?? "";
  if (/\d/.test(w) || /^(сто|тысяч|миллион|процент|half|hundred|thousand|million|percent)/i.test(w)) return "counter";
  const phraseEnd = words.slice(i, i + 5).find((x) => /[.!?…]$/.test(x.w));
  if (phraseEnd && /\?$/.test(phraseEnd.w)) return "chat";
  if (/^(во-первых|во-вторых|первое|второе|третье|шаг|раз|first|second|third|step)/i.test(w)) return "checklist";
  return null;
}

export const numberIn = (w) => {
  const m = w.replace(/\s/g, "").match(/\d+([.,]\d+)?/);
  return m ? Number(m[0].replace(",", ".")) : 100;
};
