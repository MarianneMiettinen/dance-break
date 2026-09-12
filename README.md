# Dance Break

A movement break beside your desk. At times you set, it offers one dance move, plays a
real tutorial video for it, and puts a medal in your cupboard if you danced for three
minutes.

- **15 moves**, 5 each across Hip-Hop Groove, Latin Step and Disco / Funk.
- **15 verified tutorial videos**, one per move, embedded via YouTube's
  privacy-enhanced player. Every id was opened and checked — see `js/videos.js`.
- **"Count it out" mode** — an animated figure and a beat generated in the browser,
  for when you want the count rather than a video. Works with no network.
- **Cupboard** of medals and statues. Nothing is ever taken back out.

## Run it

```
node server.js
```

Then open http://localhost:5173. The dev server exists only because ES modules will
not load over `file://` — there is no build step and no dependencies.

## Check the videos still work

```
node tools/check-videos.mjs
```

Videos rot. Run this before any release; it exits non-zero if one has gone.

## Tune the moves

```
node tools/sheet.mjs
```

Writes `tools/sheet.html`: all 15 moves at four points in their loop, plus the reward
sequence. Edit a pose in `js/data.js`, re-run, look.

## What is where

See `CLAUDE.md`.

## Third-party

The YouTube embed is the app's only outbound request and its only dependency. Videos
are played through YouTube's official embedded player from `youtube-nocookie.com`;
nothing is downloaded or re-hosted. If a video fails to load, the app falls back to the
animated figure rather than showing a dead frame.

Everything else — the music, the dancer, the medals, the statues — is generated in the
browser at runtime. There is no audio file, video file, font or image in this repo.
