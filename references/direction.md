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
- **Podcast / interview cuts** (studio, several cameras): grade the room, not the face — `grade.room` `{dim 0.4, desat 0.5, blur 5}` (podcast default; 0.25 / 0.3 / 3 for a quiet set) pushes a busy or loud-coloured set back while the speaker (the cutout) keeps their skin tone; overall contrast ≈1.1, saturate ≈0.95, brightness ≈0.96, vignette ≈0.6. Don't crush the person: if the face goes muddy, lower `brightness` less and `dim` more. A brand logo belongs on title cards (`logo`), not as a corner watermark.

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
| a thing or an idea ("идея", "команда", "единорог", "время") | `sticker` — an icon next to the head (`icon:<name>`, white glowing dots), not a card with the word on it and not an emoji; a list of wrong answers ("не идея, не команда, не технология") = stickers that `strike` on the "нет" |
| an image in the speech ("свет в конце туннеля") | `broll` with a real photo, 1–1.5 s |
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
- **sound** (`sfxVolume`): 1.0 with the accent rules below; calm/luxury 0.8.
- **music** (`mm music`): 0.4 in pauses / 0.2 under the voice is the default; calm and luxury 0.3 / 0.15; hype 0.5 / 0.25. Start the track where its chorus or drop meets the reel's turn (offer, the speaker on camera, the final call).

## 5b. Expert / podcast format (the @eightsenses podcast references)

The picture carries the meaning, text is the minimum:
- **Concept word behind the head** on most key phrases: condensed metal word + small kicker ("build an **EMPIRE**" → «кто **ВЫЖИВАЕТ**», «лучше **БЫСТРЕЕ**»), `captionBehind: false` so captions don't add their own.
- **Real visuals, not interface**: `sticker` icons for things and ideas (monochrome dot-matrix, like the references' dotted bed / heart — colourful emoji look cheap next to the dark grade), `broll` real photos for images in the speech, `pop` photos, `particles` globe for "world / everyone". Text cards (`card`, `progress`, `checklist`) only for a real number or offer.
- Icons: Phosphor fill icons (MIT) in `engine/src/icon-paths.json`, more from `https://raw.githubusercontent.com/phosphor-icons/core/main/assets/fill/<name>-fill.svg` (the inner markup goes into the JSON). Photos: Wikimedia Commons API (free licences, keep a `CREDITS.md` next to them) → crop 9:16 → `public/assets/photos/`.
- One title card at the turn of the argument, dark room grade (`grade.room`), sound between "structure" and "every meaning".
- The `podcast` look is this format as saved defaults (approved on «Успех = успеть», Codify Podcast #10): cond words behind the head, beats every ~1.6 s cycling dot-icon sticker / behind / one title, no halo, no backdrop, no chat or checklist cards, the last beat a word behind the head (no card), room grade {dim .4, desat .5, blur 5}, sound at 1 with the default budget, music `mm music` at 0.28 / ducked 0.12. The plan's title lands on the cycle; move it by hand to the sentence that turns the argument and give it the thesis as text.
- Check every reel by ear: transcribe the render and compare with the source — no word may be lost.

## 6. Three worked briefs

**"Курс программирования для подростков, продать пробный урок"** — goal sell, audience teens and parents, the speaker is a teacher at 2.6 w/s → `sell` with `--accent` from the brand; numbers ("12 уроков", "3 месяца") → counters; the closing "запишитесь" → `card` "Пробный урок ✓". Captions `mix` with `captionKeys` on the numbers.

**"Подкаст: почему ИИ не заменит программистов"** — `podcast`; "по данным" + number → `counter`, "рост" → `chart`, "ИИ", "программист", "команда" → stickers, the thesis → the one `title` with the brand logo; captions `mix`; rim outline on the hook.

**"Объясняем родителям, что ребёнок делает на уроке"** — `calm`, `clean` captions, steps → `checklist`, one `quote` from a parent, no shakes, sound at 0.5.

## Sound design

Inflation kills sound: if every effect makes a noise, none of them means anything. A 40 s reel gets **6–10 cues** by default (between "structure only" and "every meaning"), not 70.

1. **A sound marks a change of state the viewer must register**: a new section (title card), the music drop, the offer facts (gift, deadline, scarcity), a message arriving, the final ask. Motion that is only decoration — outlines, halos, rims, orbits, particles, rays, ribbons, punches, shakes, caption words flying behind the head, checklist ticks, typing — stays silent. The motion already is the accent.
2. **Budget**: ≤ 3 cues in any 10 s, ≥ 1.5 s apart (the engine enforces it for automatic sounds). Two identical objects in a row (two gift cards) = one gesture, same sound.
3. **One meaning = one sound for the whole reel**: title card always whoosh-big + impact, an offer card always pop, a number always `counter`, a message always `notify`. The second title card must sound like the first so it reads instantly.
4. **Layers**: at most 2 at one moment, and only on the pillars (title cards, the drop).
5. **Put sounds in the speech gaps.** Under speech keep mid/high sounds ≤ 0.4, low booms ≤ 0.45. Align whooshes and risers by their peak (`peak: true`).
6. **Let the music work**: one riser peaking on the chorus/drop + one impact, then nothing for ~5 s — the drop is the reward. `music.drop` + `dropDuck` lift the bed a little there; a `dips` entry (≈0.4 s at 0.08) before the call to action is a taste call — render it as a variant.
7. **Silence is the contrast.** Open the hook on voice + music; end on the music tail, no final hit.
8. When unsure, render 2–3 variants (`edit.A.json`… → `--variant A`): A = structure only (~8 cues), B = meaning accents (~15), C = motion-led, no UI sounds (~12).
