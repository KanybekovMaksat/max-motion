# Direction: picking captions, colours and motion for the video's goal

Decide in this order. Write each decision down in one line before touching edit.json — the user sees them in the final table.

## 1. Read the brief and the speech

From the user's message and `words.json`, fill in:

| question | how to tell |
|---|---|
| **Goal**: sell, build a brand, explain, react to news, interview, show something premium | the user's words; if silent, the transcript ("записывайтесь", "цена" → sell; "я считаю" → podcast) |
| **Audience**: teens, parents, business, creators | who the speaker addresses ("ваш ребёнок" → parents) |
| **Energy**: words per second = `words.length / duration` | > 3.0 fast, 2.0–3.0 normal, < 2.0 calm |
| **Content**: numbers, lists, questions, places/things, emotions | scan the words; `tools/looks.mjs → contentKind` does the basic part |
| **Picture**: dark or light room, close-up or wide, colour of clothes/walls | look at one frame of `base.mp4` (`mm still <slug> 1`) |

## 2. Pick the look

`mm plan <slug> --goal "<the goal in words>"` maps keywords to a look; override with `--look` when your reading differs.

| look | goal / audience | energy | captions | word behind | camera | beats | обводка | перебивки | colour |
|---|---|---|---|---|---|---|---|---|---|
| `sell` | offer, course, product, listing | normal | `mix` | sans, accent gradient | punch + shake every 3rd | 1.1 s | neon on hook, sticker with photos | every ~4 s | blue `#3B82F6` |
| `brand` | personal brand, creator, lifestyle | normal | `mix` | sans | punch, shake every 4th | 1.2 s | sticker | rare | lime `#B8F02A` |
| `podcast` | interview, expert opinion, storytelling | calm–normal | `mix` | serif / cond metal | punch, shake every 4th | 1.4 s | rim | every ~3 s, with `path` for steps | indigo `#6E8BFF` |
| `hype` | news, trends, teens, hot takes | fast | `mix` (or `word`) | cond caps | shake every 2nd + whips | 0.85 s | neon | often | red `#FF3D57` (or yellow `#FFD400`) |
| `calm` | teaching, parents, instructions, trust | calm | `clean` | serif | soft punch only, **no shake** | 1.8 s | rim, once | 1–2 per video | green `#22C55E` or brand colour |
| `luxury` | premium, real estate, high ticket | calm | `mix` | serif white-metal | slow punch, **no shake** | 1.6 s | rim | title cards, gold | gold `#D4AF37` |

Mixed signals: goal wins over energy (a fast-talking teacher stays `calm` but with `gap` closer to 1.3 s); audience wins over taste (parents → never `hype`).

## 3. Colours

- One accent per reel. Everything else is white, near-black and the footage.
- The brand has a colour → use it as `--accent`, unless it's within 30° of hue of the dominant room/clothes colour; then take the look's default.
- Dark room → bright accent (lime, red, blue 500). Light room → deeper accent (blue 600, green 600) so words read on walls.
- Warm skin + warm room → cool accent (blue/indigo). Cold, grey room → warm accent (gold, red).
- Light accents (lime, yellow, gold): `pill` captions switch to dark text automatically, `mix` caps take the accent as is (fine on a dark room, use a deeper accent on a light one); keep `behind` words big (≥ 180 px) so the gradient reads.
- Grade follows the look: `podcast`/`luxury` darker with a heavy vignette, `brand`/`calm` brighter and flatter, `hype` more contrast and saturation.

## 4. Captions

| style | looks like | use when |
|---|---|---|
| `mix` (default) | small sans phrase; the key word in big serif italic (pops) or condensed caps in the accent (types in); plain words slide up through a blur, rise out of a mask or type; every ~3rd key word goes big **behind the person** instead | almost always — it's the reference look |
| `pill` | 1–3 words, the spoken one on an accent chip | selling, branding, normal pace |
| `serif` | phrase slides up, the key word in big serif italic | podcasts, emotional lines, premium |
| `word` | one huge condensed word at a time, long words in accent | fast speech, hype, teens |
| `clean` | one readable line on a soft strip, the spoken word underlined | teaching, parents, sound-off viewers, long sentences |

`mix` picks the key word itself (a number, else the longest word of 5+ letters); force it with `"captionKeys": [...]` when the meaning sits on a short word. A caption word goes behind the head only when no `behind` / `film` / `title` / `broll` / `chart` is on screen, so a hand-placed `behind` always wins. `"captionBehind": false` keeps every word in front (busy backgrounds, a lot of hair movement).
Set `"captions": false` only when the video already has burned-in subtitles.

### Safe zone
Instagram, TikTok and Shorts cover the bottom ~25 %, the top bar and a right column of buttons. Captions and every front card are placed inside `platform`'s safe box automatically (`all` by default = the union, since one reel usually goes everywhere; `mm plan … --platform tiktok` for one app). Check with `mm still <slug> <sec> --safe` (or `--safe reels|tiktok|shorts`): the app UI is drawn on top, covered areas tinted red, the safe box dashed green. Transparent templates for other editors: `assets/safe-zones/*.png`.

## 5. Motion: what goes on each beat

Map the content first, then fill the rest from the look's cycle.

| the speaker says | effect |
|---|---|
| the main noun of a phrase | `behind` (font from the look; `serif` for feelings, `cond` for a shout) |
| a number, a price, a percentage | `counter` (label = the words after it) |
| a list, "во-первых", steps | `checklist`; steps/levels → `title` with `path` |
| a question, someone's words | `chat` |
| a goal, a result, readiness | `progress` or `card` with a ✓ badge |
| a place, a product, "look at this" | `pop` photos (+ `sticker` outline) or `broll` with a `whip` before |
| growth, decline, statistics | `chart` |
| the world, AI, data, "everyone" | `particles` globe |
| social networks, apps | `orbit` |
| a new thought / turn in the story | `title` перебивка (kicker = the words before) |
| the hook (first 1.5 s) | strongest move: outline + behind + halo/ribbon + punch |
| the last line / CTA | `card` or `progress`, no new big effect after it |

Intensity knobs, per look:
- **beat gap** (`gap`): hype 0.85 s ↔ calm 1.8 s. Never two effects starting within 0.4 s except camera + its effect.
- **camera**: `shake` is loud — max every 2nd beat (hype), never in calm/luxury.
- **обводки**: 1–3 per reel. **перебивки**: hype/sell every 3–4 s, podcast every ~3 s, calm 1–2 total.
- **sound** (`sfxVolume`): hype 1.0, sell 0.9, podcast 0.7, luxury 0.6, calm 0.5. Over music or a loud voice track, drop 0.2.

## 6. Three worked briefs

**"Курс программирования для подростков, продать пробный урок"** — goal sell, audience teens and parents, the speaker is a teacher at 2.6 w/s → `sell` with `--accent` from the brand; numbers ("12 уроков", "3 месяца") → counters; the closing "запишитесь" → `card` "Пробный урок ✓". Captions `mix` with `captionKeys` on the numbers.

**"Подкаст: почему ИИ не заменит программистов"** — `podcast`; "по данным" + number → `counter`, "рост" → `chart`, "во-первых / во-вторых" → `title` with `path`; captions `serif`; rim outline on the hook.

**"Объясняем родителям, что ребёнок делает на уроке"** — `calm`, `clean` captions, steps → `checklist`, one `quote` from a parent, no shakes, sound at 0.5.
