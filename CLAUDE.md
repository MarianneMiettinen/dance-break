# Dance Break — project context

Desk-side movement break. At times you set, it offers one dance move, plays a beat in
time with it, shows an animated figure doing it on the count, and puts a medal in a
cupboard if you danced for three minutes.

## Persona

**A** (see global `audience.md`). Declared, not asked — flag it if wrong, it is a
one-line change and a copy pass.

## Stack

Vanilla JS, HTML, CSS. ES modules. No dependencies, no build step. `node server.js`
is dev-only; the app itself needs no server.

## Where things are

| File | Job |
|---|---|
| `js/data.js` | The 15 moves. Pose keyframes, counted cues, written steps. Content, not code. |
| `js/skeleton.js` | Pure forward kinematics. No DOM. The single source of truth for the figure. |
| `js/figure.js` | Browser renderer. Thin — it only writes SVG attributes from `solve()`. |
| `js/audio.js` | Web Audio drum machine + bass. One pattern per style. |
| `js/schedule.js` | Times x weekdays. The seam Stage 2 swaps for `chrome.alarms`. |
| `js/rewards.js` | Medals and statues. Deterministic materials, SVG generation. |
| `js/app.js` | Screens and wiring. |
| `tools/sheet.mjs` | Renders every move + reward to a static HTML sheet for tuning by eye. |

## Rules this codebase holds itself to

- **No network requests. None.** Not for audio, not for fonts, not for analytics. The
  only outbound thing is the "See it danced" link, and only on click.
- **No hardcoded YouTube video IDs.** A search URL cannot rot. An unverified ID can.
- **Rewards are deterministic.** Never variable-ratio. A random reward schedule is a
  slot machine, and this audience does not need one.
- **Rewards are never removed.** A collection accumulates; a streak breaks.
- **No streaks, no "you missed", no empty slots implying a gap.**
- Only `transform` and `opacity` are animated.
- The visual language in `css/app.css` is placeholder. There is no `design.md` yet.
