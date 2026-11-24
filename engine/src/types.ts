// edit.json — one file per clip, written by `npm run plan`, hand-tuned after.
// Every effect starts at `at` seconds (usually a word's start) and lasts `dur` seconds.

export type Face = { x: number; y: number; w: number; h: number };

export type Meta = {
  slug: string;
  duration: number;
  fps: number;
  width: number;
  height: number;
  face: Face;
};

export type Word = { w: string; s: number; e: number };

// per-frame head position from the person matte: top of the head (y) and its centre (x), output pixels
export type Head = { top: number; x: number };

type Base = { at: number; dur: number };

export type Fx =
  // giant word between the background and the person ("sold", "house")
  | (Base & { type: "behind"; text: string; kicker?: string; y?: number; color?: string; font?: "sans" | "serif" | "cond" })
  // photos that fly out from behind the shoulders
  | (Base & { type: "pop"; images: string[] })
  // glowing arc ring behind the head
  | (Base & { type: "halo"; color?: string })
  // UI card in front: thumbnail + title + green badge ("The house ✓ Sold")
  | (Base & { type: "card"; title: string; badge?: string; image?: string })
  // app icons orbiting the person, passing behind and in front
  | (Base & { type: "orbit"; icons: string[] })
  // zoom punch on a stressed word
  | (Base & { type: "punch"; scale?: number })
  // soft coloured light behind the person, background dims
  | (Base & { type: "backlight"; color?: string })
  // full-screen cutaway (image or video) with a caption
  | (Base & { type: "broll"; src: string; text?: string })
  // film strip of photos behind the head with a word on it
  | (Base & { type: "film"; text: string; images: string[] })
  // search bar that types the text
  | (Base & { type: "search"; text: string })
  // light sweep / god rays from the top
  | (Base & { type: "rays"; color?: string })
  // ribbon that wraps around the person: back half under the cutout, front half over it
  | (Base & { type: "ribbon"; color?: string })
  // note card with a quote, typed in serif italic
  | (Base & { type: "quote"; text: string; author?: string })
  // 3D shake: the scene tilts in perspective and settles, with a push-in
  | (Base & { type: "shake"; scale?: number })
  // whip: the scene smears sideways with motion blur (a cut on the beat)
  | (Base & { type: "whip"; dir?: 1 | -1 })
  // stat card that counts up ("TOTAL LISTINGS 165")
  | (Base & { type: "counter"; label: string; to: number; from?: number; prefix?: string; suffix?: string })
  // checklist of pills ticking one by one
  | (Base & { type: "checklist"; items: string[] })
  // chat bubble: typing dots, then the message
  | (Base & { type: "chat"; text: string; name?: string })
  // card with a segmented bar filling up ("Multiple offers")
  | (Base & { type: "progress"; title: string })
  // dot globe / dot grid behind the head
  | (Base & { type: "particles"; shape?: "globe" | "grid" })
  // line chart drawing itself, full card
  | (Base & { type: "chart"; label?: string; trend?: "up" | "down" })
  // outline around the person's silhouette: neon tube, white sticker edge or soft rim light
  | (Base & { type: "outline"; style?: "neon" | "sticker" | "rim"; color?: string })
  // full-screen title card between phrases (перебивка): curtain + glass light + metal word
  | (Base & { type: "title"; text: string; kicker?: string; kickerStyle?: "caps" | "serif"; path?: string[]; bg?: string })
  // any sound from public/sfx at a moment
  | (Base & { type: "sfx"; name: string; volume?: number });

export type FxType = Fx["type"];

export type Edit = {
  slug: string;
  accent: string;
  captions: boolean;
  // pill  = 1–3 words, the spoken one on an accent chip (sell, brand)
  // serif = phrase slides up, the key word in big serif italic (podcast, premium)
  // word  = one huge condensed word at a time, accent on key words (hype, news)
  // clean = one readable line on a soft strip, the spoken word underlined (teaching, parents)
  // mix   = small sans phrase + key word in serif italic or caps, words blur in / rise / pop / type,
  //         every ~3rd key word goes behind the person (default)
  captionStyle?: "mix" | "pill" | "serif" | "word" | "clean";
  // mix: words that must carry the accent (otherwise numbers, then the longest word)
  captionKeys?: string[];
  // mix: false keeps every caption in front of the person
  captionBehind?: boolean;
  // where the reel goes: captions and cards stay out of that app's UI ("all" = union of the three)
  platform?: "reels" | "tiktok" | "shorts" | "all";
  // the look the plan was made with (tools/looks.mjs), for the record
  look?: string;
  // auto sound on every effect (whoosh, pop, tick…) and its overall level
  sfx?: boolean;
  sfxVolume?: number;
  grade: { contrast: number; saturate: number; brightness: number; vignette: number };
  fx: Fx[];
};

export type ProEditProps = { slug: string; safe?: "reels" | "tiktok" | "shorts" | "all" };
