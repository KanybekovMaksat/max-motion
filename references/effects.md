# edit.json reference

```json
{
  "slug": "x", "accent": "#6E8BFF",
  "look": "podcast",                           // which preset the plan used (see direction.md)
  "captions": true, "captionStyle": "serif",   // "pill" | "serif" | "word" | "clean"
  "sfx": true, "sfxVolume": 0.7,
  "grade": { "contrast": 1.1, "saturate": 0.95, "brightness": 0.96, "vignette": 0.6 },
  "fx": [ { "type": "...", "at": 1.25, "dur": 0.8, ... } ]
}
```
`at` = seconds (usually a word's `s` minus ~0.05), `dur` = seconds. Order doesn't matter.

| type | layer | fields | use on |
|---|---|---|---|
| `behind` | under person | `text`, `kicker?`, `font?` sans/serif/cond, `color?`, `y?` | the key noun of a phrase |
| `pop` | under | `images[]` (1–4) | places, products, "photos" |
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
| `title` | over all | `text`, `kicker?`, `kickerStyle?` caps/serif, `path?` ["1A","1B"], `bg?` | перебивка: a new thought, a step list, a big claim |
| `sfx` | audio | `name`, `volume?` | extra hits |

Layout slots (don't stack two in one slot at the same time):
- top third: `behind` word (on the head), `film`
- sides: `pop` photos, `orbit`
- lower third y≈1150–1520: `card` / `counter` / `checklist` / `chat` / `progress` / `search` / `quote` — one at a time
- y≈1550–1650: captions
