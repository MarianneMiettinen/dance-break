# Dance Break — project context

Desk-side movement break. At times you set, it offers one dance move, plays a real
tutorial video for it, and puts a medal in a cupboard if you danced three minutes.

## Persona

**A** (see global `audience.md`). Declared, not asked — flag it if wrong.

## Stack

Vanilla JS, HTML, CSS. ES modules. No dependencies, no build step. `node server.js` is
dev-only.

## Where things are

| File | Job |
|---|---|
| `js/data.js` | The 15 moves. Pose keyframes, counted cues, written steps. Content, not code. |
| `js/videos.js` | The 15 reference videos. The app's ONLY third-party dependency, deliberately in one auditable file. |
| `js/player.js` | YouTube IFrame API wrapper. Owns all the async/failure handling. |
| `js/skeleton.js` | Pure forward kinematics. No DOM. Single source of truth for the figure. |
| `js/figure.js` | Browser renderer. Thin — only writes SVG attributes from `solve()`. |
| `js/audio.js` | Web Audio drum machine + bass, for "Count it out" mode. |
| `js/schedule.js` | Times x weekdays. The seam Stage 2 swaps for `chrome.alarms`. |
| `js/rewards.js` | Medals and statues. Deterministic materials, SVG generation. |
| `js/app.js` | Screens and wiring. |
| `tools/check-videos.mjs` | Re-verifies every video still resolves. Run before release. |
| `tools/sheet.mjs` | Renders every move + reward to a static sheet for tuning by eye. |

## Rules this codebase holds itself to

- **One third-party dependency: the YouTube embed.** It lives in `videos.js` and
  `player.js` and nowhere else. Any new outbound request is a decision to raise, not
  a detail to add.
- **No video id ships unverified.** Existence (oEmbed 200) and embed permission
  (`YT.Player` onReady, not onError 101/150) are separate checks. Both, every time.
- **`title`/`channel` in videos.js are verbatim upstream**, so drift detection works.
  `label` is the tidied display string.
- **Rewards are deterministic.** Never variable-ratio — a random reward schedule is a
  slot machine, and this audience does not need one.
- **Rewards are never removed.** A collection accumulates; a streak breaks.
- No streaks, no "you missed", no empty slots implying a gap.
- Only `transform` and `opacity` are animated.
- Light theme only, by request. Dark mode was removed rather than half-maintained.

## Known gaps

- The app cannot open itself with no tab open. That is Stage 2 (MV3 extension).
- Reduced-motion is implemented but not tested under a real
  `prefers-reduced-motion: reduce` setting.
- Contrast is chosen against the AA floor by eye, not measured.
- The 15 poses are tuned from the contact sheet, not from anyone dancing them.
