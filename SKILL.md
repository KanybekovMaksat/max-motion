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
4. **Check** — `mm still <slug> <sec>` at the hook, 3–4 beats and the end; read the PNGs (`~/max-motion/out/`), fix overlaps, clipped words, faces covered.
5. **Render** — `mm render <slug>` → `~/max-motion/out/<slug>.mp4`. Wrapper reels: `--wrap all` (or `showcase,chat,prompt`), texts in `public/<slug>/wrap.json` (shared fields on top, per-wrapper under `"wrappers"`, see `engine/examples/teen-max/wrap.json`).
6. **Hand over** — copy the mp4s next to the user's source video, show a stills strip and one table: beat time → what the speaker says → effect. Name the look and why it fits the goal.

## Wrapper reels (for posting "AI edited this")

| `--wrap` | frame |
|---|---|
| `showcase` | hater comment → "Wait… CLAUDE edited this?" → BEFORE / AFTER + terminal "Render reel.mp4? › Yes" |
| `chat` | Claude window: raw clip + skill chip → "Here is your reel ✓" + steps ticking → Download → Saved |
| `prompt` | "I DIDN'T EDIT THIS": Claude Code typing the prompt + steps, result phone, "Step 3 of 6" |

## Notes

- Sounds are in `engine/public/sfx/` (whoosh, pop, click, ding, impact, swish, tick, type, riser); each effect plays its own, `sfxVolume` scales them, `{type:"sfx",name,at}` adds one. More sounds: ElevenLabs `POST /v1/sound-generation` if the user has `ELEVENLABS_API_KEY`.
- Examples of tuned edits: `engine/examples/*/edit.json` (their `assets/…` photos are the author's and are not shipped — swap in your own).
- `public/<slug>` files must be real files, not symlinks (Remotion drops symlinks) — copy with `cp -c`.
- No speech → the plan is empty; direct it from the picture.
- Live preview while tuning: `mm studio`.
- Instagram references: single reel links download with `yt-dlp`; profile pages need a login.
