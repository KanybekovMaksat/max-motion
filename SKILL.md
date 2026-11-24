---
name: max-motion
description: Edit a raw talking-head video into a pro motion reel in the @eightsenses.media style — word behind the head, photos and UI cards popping on the words, outlines (neon/sticker/rim), title-card interstitials, glass ribbon, dot globe, counters, checklists, chat bubbles, 3D shakes, whips, animated captions, sound effects — with captions, colours and motion chosen for the video's goal; optionally wrapped in viral "hater comment → CLAUDE edited this?" frames. Use when the user runs /max-motion, sends a raw video and asks to edit / montage it ("смонтируй", "edit this in my style", "сделай как eightsenses"). macOS only.
---

# max-motion

Everything runs through `scripts/mm` in this skill's folder (call it with the absolute path, e.g. `<skill dir>/scripts/mm`).
On first use it installs what's missing — Homebrew `ffmpeg` + `whisper-cpp`, node packages, the Apple Vision cutout tool, the whisper model (~480 MB) — into the workspace `~/max-motion` (override with `MAX_MOTION_HOME`). Run `mm doctor` first and tell the user the first run takes a few minutes.

Read before directing an edit:
- [references/direction.md](references/direction.md) — how to pick the look, captions, colours and motion for the goal and content. **Always.**
- [references/effects.md](references/effects.md) — every effect and its fields.
- [references/style.md](references/style.md) — what makes the reference style work.

## Workflow

1. **Brief.** From the user's message get: the video file, the goal (sell / brand / explain / news / podcast / premium), the audience, a brand colour if any, whether they want the wrapper reels. Ask only if the goal is truly unclear — otherwise infer it from the speech after step 2.
2. **Prep** — `mm prep <video> <slug> --lang ru|en|auto --cut`
   9:16 face-centred crop, pauses cut, word timings, person cutout, head track → `~/max-motion/public/<slug>/`.
   Open `words.json`: fix misheard names/brands by hand (keep the timings).
3. **Direct** — follow `references/direction.md`: read energy and content, pick the look, then
   `mm plan <slug> --goal "<goal in words>"` (or `--look <name>`, `--accent #hex`). The plan is a draft from the look + content rules; rewrite `edit.json` by meaning: right word behind the head, numbers → counters, lists → checklists, one front card at a time, nothing over the face. Never `--force` over an edit you already tuned.
   Photos for `pop` / `film` / `card` / `broll`: put the user's real images or clips in `~/max-motion/public/assets/` and reference them as `assets/<file>`. No photos → the plan skips those effects.
4. **Check** — `mm still <slug> <sec>` at the hook, 3–4 beats and the end; read the PNGs (`~/max-motion/out/`), fix overlaps, clipped words, faces covered. Then the same seconds with `--safe` (app UI drawn on top): nothing readable may sit under the description, the buttons or the top bar. `mm render <slug> --safe` gives a whole preview video with the overlay.
5. **Render** — `mm render <slug>` → `~/max-motion/out/<slug>.mp4`. Wrapper reels: `--wrap all` (or `showcase,chat,prompt`), texts in `public/<slug>/wrap.json` (shared fields on top, per-wrapper under `"wrappers"`, see `engine/examples/teen-max/wrap.json`).
6. **Hand over** — copy the mp4s next to the user's source video, show a stills strip and one table: beat time → what the speaker says → effect. Name the look and why it fits the goal.

## Wrapper reels (for posting "AI edited this")

| `--wrap` | frame |
|---|---|
| `showcase` | hater comment → "Wait… CLAUDE edited this?" → BEFORE / AFTER + terminal "Render reel.mp4? › Yes" |
| `chat` | Claude window: raw clip + skill chip → "Here is your reel ✓" + steps ticking → Download → Saved |
| `prompt` | "I DIDN'T EDIT THIS": Claude Code typing the prompt + steps, result phone, "Step 3 of 6" |

## Notes

- **Sound.** The sound pack lives in `sounds/pack/` inside the skill (local only, licensed, never committed); `mm` builds the library from it automatically → `public/sfx/*.mp3` + `index.json`. Elsewhere: `mm sfx <pack folder | public Yandex Disk link>`. **Before adding sounds by hand read `sounds/CATALOG.md`** — every sound with its length and peak: 49 named ones the effects use (`engine/tools/sfx.mjs`) and the whole pack as `pack/<slug>`. **Sound is an accent, not decoration — read "Sound design" in `references/direction.md` before placing any.** By default only title cards, counters, charts, arriving chat messages, b-roll cuts, cards with `accent: true` and whips with `section: true` make a sound; everything else is silent unless it has `sound: true`. A scheduler (`engine/src/sound.tsx`) keeps it to ≤ 4 cues per 10 s, ≥ 1.2 s apart. For a hand-made cue sheet set `"sfx": false` and add `{type:"sfx", name, at, volume, peak}` cues. Not sure → write 2–3 sheets as `edit.A.json`, `edit.B.json`… and `mm render <slug> --variant A` each, let the user choose.
- **Music.** `mm music <slug> <track> [--start <sec>] [--volume 0.4] [--duck 0.2]` → `public/<slug>/music.mp3`, levelled to the voice; plays at `volume` in pauses and ducks to `duck` under speech. Pick `--start` so the drop or chorus lands on the reel's main moment.
- **Levels.** Sounds and music follow the voice loudness (`meta.lufs`), the render masters the reel to −14 LUFS. Aim for the voice ≥ 9 dB over music + sounds; if it's busy, lower `sfxVolume` before touching the music.
- Examples of tuned edits: `engine/examples/*/edit.json` (their `assets/…` photos are the author's and are not shipped — swap in your own).
- `public/<slug>` files must be real files, not symlinks (Remotion drops symlinks) — copy with `cp -c`.
- No speech → the plan is empty; direct it from the picture.
- Live preview while tuning: `mm studio`.
- Safe zones (Reels / TikTok / Shorts, 1080×1920) live in `engine/src/safe-zones.json`; transparent overlay PNGs in `assets/safe-zones/` (re-export with `mm safezones`).
- Instagram references: single reel links download with `yt-dlp`; profile pages need a login.
