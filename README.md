# Dance Break

A movement break beside your desk. One move per break, a beat generated in the
browser, an animated figure counting it out, and a cupboard of medals.

## Run it

```
node server.js
```

Then open http://localhost:5173. The dev server exists only because ES modules will
not load over `file://` — the app has no build step and no dependencies.

## Tune the moves

```
node tools/sheet.mjs
```

Writes `tools/sheet.html`: all 15 moves at four points in their loop, plus the reward
sequence. Edit a pose in `js/data.js`, re-run, look.

## What is where

See `CLAUDE.md`.

## Licensing

Nothing is licensed in, because nothing is bundled in. The music is synthesised at
runtime with the Web Audio API and the dancer is drawn from coordinates. There is no
audio file, no video file, no font and no image in this repository.
