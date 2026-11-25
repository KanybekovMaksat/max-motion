# edit.json reference

```json
{
  "slug": "x", "accent": "#6E8BFF",
  "look": "podcast",                           // which preset the plan used (see direction.md)
  "captions": true, "captionStyle": "mix",     // "mix" (default) | "pill" | "serif" | "word" | "clean"
  "captionKeys": ["1500", "винить"],           // mix: words that must carry the accent (optional)
  "captionBehind": true,                       // mix: false = no caption word behind the person
  "platform": "all",                           // safe zone: "reels" | "tiktok" | "shorts" | "all" (union, default)
  "sfx": true, "sfxVolume": 0.7,
  "music": { "src": "x/music.mp3", "volume": 0.4, "duck": 0.2 },  // written by `mm music`
  "grade": { "contrast": 1.1, "saturate": 0.95, "brightness": 0.96, "vignette": 0.6,
             "room": { "dim": 0.4, "desat": 0.5, "blur": 5 } },  // optional: background only, the person stays bright
  "fx": [ { "type": "...", "at": 1.25, "dur": 0.8, ... } ]
}
```
`at` = seconds (usually a word's `s` minus ~0.05), `dur` = seconds. Order doesn't matter.

| type | layer | fields | use on |
|---|---|---|---|
| `behind` | under person | `text`, `kicker?`, `font?` sans/serif/cond, `color?`, `y?` | the key noun of a phrase |
| `pop` | under | `images[]` (1–4) | places, products, "photos" |
| `sticker` | over (or under with `behind`) | `src` (`icon:<name>` = monochrome dot icon from `src/icon-paths.json`, or a cut-out PNG / photo), `pos?` left/right/top-left/top-right/low-left/low-right, `size?` 220–300, `strike?` s after start → greyed + crossed, `label?` | **a thing or idea named in speech — instead of a text card**: `icon:lightbulb`, `icon:users-three`, `icon:robot`, `icon:timer` — icons, never emoji; placed off the face shot by shot (`faces.json`) and off the other stickers on screen |
| `halo` | under | `color?` | hook, "sold", a win |
| `orbit` | both | `icons[]`: instagram tiktok youtube telegram whatsapp claude python js | social, platforms, tools |
| `ribbon` | both | `color?` | brand moment, intro |
| `film` | under | `text`, `images[]` | "editors", "stories", a series |
| `particles` | under | `shape?` globe/grid | world, data, AI, abstract |
| `backlight` | under | `color?` | whole clip, mood |
| `rays` | under | `color?` | the punch line, "results" |
| `card` | over | `title`, `badge?`, `image?` | a thing + its status |
| `counter` | over | `label`, `to`, `from?`, `prefix?`, `suffix?` | any number |
| `checklist` | over | `items[]` (2–4) | lists, features |
| `chat` | over | `text`, `name?` | quoted question, a client |
| `progress` | over | `title` | offers, days, readiness |
| `search` | over | `text` | "people google…", a question |
| `quote` | over | `text`, `author?` | a quote, a rule |
| `chart` | over all | `label?`, `trend?` up/down | growth, decline, stats |
| `broll` | over all | `src` (jpg/mp4 in public/), `text?` | concrete nouns, 0.6–1.2 s |
| `punch` | camera | `scale?` 1.1–1.18 | most beats |
| `shake` | camera | `scale?` | every 3rd beat, impacts |
| `whip` | camera | `dir?` 1/-1 | 0.1 s before a broll or scene change, `dur` 0.2 |
| `outline` | between room and person | `style?` neon/sticker/rim, `color?` | обводка: hook, punch line, around popping photos |
| `title` | over all | `text`, `kicker?`, `kickerStyle?` caps/serif, `path?` ["1A","1B"], `bg?`, `logo?` (svg/png in public/, small above the kicker) | перебивка: a new thought, a step list, a big claim |
| `sfx` | audio | `name`, `volume?`, `peak?` (its loudest point lands on `at`). Library (`sounds/CATALOG.md`; whole pack as `pack/<slug>`): whoosh-1…4, whoosh-big/-sharp/-camera/-click/-chimes, riser, riser-short, riser-metal, impact-1/-2/-bell, hit-1…4, click-1…3, click-crispy, beep-1…3, ui-1…4, build-1/2, pop-1…4, notify, type, counter, toggle, zoom, transform-1/2, rubber, blur-out, hud, tech, success | hand-placed accents |

Any effect takes `sound: true|false` to force its sound on/off; `card` takes `accent: true` (offer fact → pop), `whip` takes `section: true` (new part → whoosh).

Layout slots — all inside the safe zone of `platform` (`engine/src/safe-zones.json`; `all` = x 60–888, y 220–1436), placed by the engine, not by hand. **Captions are never covered** (`engine/src/layout.ts`):
- caption band: the bottom 230 px of the safe zone, 40 px up (y≈1166–1396 for `all`); every phrase is shrunk to fit it, and captions are drawn above every layer, title cards and b-roll included
- nothing readable enters the band: card slot, photos, orbit, ribbon, globe, chart, title-card path and b-roll text all end 24 px above it (y≈1142 for `all`)
- top third: `behind` word (on the head, never above the safe top), `film`, title-card `logo`
- sides: `pop` photos, `orbit`
- card slot, bottom edge right above the caption band: `card` / `counter` / `checklist` / `chat` / `progress` / `search` / `quote` — one at a time; keep checklists to ≤ 3 items so they don't reach the face
- under y≈1436 and right of x≈888 the app draws the description, avatar, sound and buttons — nothing readable goes there
