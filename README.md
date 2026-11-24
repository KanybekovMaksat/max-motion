# max-motion

Claude Code skill: a raw talking-head video in, a pro motion reel out — word behind the head, outlines, title-card interstitials, photos and UI cards popping on the words, counters, checklists, chat bubbles, dot globe, 3D shakes, whips, animated captions and sound effects. Captions, colours and motion are picked for the goal of the video (sell, brand, podcast, news, teaching, premium). Optional wrapper reels in the "hater comment → CLAUDE edited this?" format.

Скилл для Claude Code: сырое видео с говорящим человеком → готовый монтаж в стиле @eightsenses.media. Стиль субтитров, цвета и моушн подбираются под цель ролика.

## Install

```bash
git clone https://github.com/KanybekovMaksat/max-motion ~/.claude/skills/max-motion
```

Then in Claude Code: `/max-motion` + your video (path) + what the video is for.

The first run installs the rest by itself (a few minutes): `ffmpeg` and `whisper-cpp` via Homebrew, node packages, the Apple Vision cutout tool, the whisper model (~480 MB). Workspace: `~/max-motion` (set `MAX_MOTION_HOME` to change).

Requirements: **macOS** (the person cutout uses Apple Vision), Homebrew, Node 18+, Xcode command line tools (`xcode-select --install`).

## By hand

```bash
mm=~/.claude/skills/max-motion/scripts/mm
$mm doctor                                   # install / check
$mm prep ~/Movies/raw.mov demo --lang ru --cut
$mm plan demo --goal "продать пробный урок"   # or --look sell|brand|podcast|hype|calm|luxury
$mm still demo 1.5                           # check a frame
$mm render demo --wrap all                   # ~/max-motion/out/demo*.mp4
$mm studio                                   # live preview
```

## Looks

| look | for | captions | colour |
|---|---|---|---|
| `sell` | offers, courses, listings | pill | blue |
| `brand` | personal brand, creators | pill | lime |
| `podcast` | interviews, experts | serif | indigo |
| `hype` | news, trends, teens | one big word | red |
| `calm` | teaching, parents | clean line | green |
| `luxury` | premium | serif | gold |

How the choice is made: [references/direction.md](references/direction.md). All effects: [references/effects.md](references/effects.md).

## What's inside

```
SKILL.md              instructions for Claude
references/           direction (looks, captions, colours, motion), effects, style notes
scripts/mm            installer + runner
engine/               Remotion project: src/ (effects, captions, wrappers), tools/ (prep, plan, render, looks, cutout), public/sfx, examples/
```
