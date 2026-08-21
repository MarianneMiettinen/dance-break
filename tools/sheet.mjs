// Renders every move and every reward to a static HTML sheet, using the SAME modules
// the app uses. Its job is to make 15 moves tunable by eye without pressing play 15
// times — change a pose in data.js, re-run, look.
//
//   node tools/sheet.mjs
//
// Writes tools/sheet.html.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { STYLES } from '../js/data.js';
import { solve, poseAt, VIEWBOX } from '../js/skeleton.js';
import { rewardFor, rewardSVG, rewardTitle, STYLE_COLOR } from '../js/rewards.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SAMPLES = 4;

function dancerSVG(move, beat, w = 132) {
  const s = solve(poseAt(move, beat, false));
  const lines = s.segments.map((g) =>
    `<line x1="${g.a[0].toFixed(1)}" y1="${g.a[1].toFixed(1)}" x2="${g.b[0].toFixed(1)}" y2="${g.b[1].toFixed(1)}" stroke-width="${g.w}" stroke-linecap="round"/>`).join('');
  const hands = s.hands.map((h) => `<circle cx="${h.x.toFixed(1)}" cy="${h.y.toFixed(1)}" r="5.5" class="hand"/>`).join('');
  return `<svg viewBox="${VIEWBOX}" width="${w}" height="${w * 1.5}">
<ellipse cx="${s.shadow.cx.toFixed(1)}" cy="${s.shadow.cy}" rx="${s.shadow.rx.toFixed(1)}" ry="${s.shadow.ry}" opacity="${s.shadow.opacity.toFixed(2)}" class="shadow"/>
<g class="body">${lines}</g>${hands}
<circle cx="${s.head.x.toFixed(1)}" cy="${s.head.y.toFixed(1)}" r="${s.head.r}" class="head"/>
<line x1="100" y1="0" x2="100" y2="300" class="axis"/>
</svg>`;
}

let html = `<!doctype html><meta charset="utf-8"><title>Dance Break — contact sheet</title>
<style>
 body{margin:0;padding:32px;background:#f7f4f0;color:#1c1a24;
      font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
 h1{font-size:26px;margin:0 0 4px} h2{font-size:19px;margin:40px 0 4px}
 .sub{color:#7b7588;margin:0 0 16px;font-size:14px}
 .move{background:#fff;border:1.5px solid #ddd6cd;border-radius:16px;padding:16px 18px;margin:14px 0}
 .mh{display:flex;align-items:baseline;gap:12px;margin-bottom:10px;flex-wrap:wrap}
 .mh b{font-size:17px} .mh .meta{color:#7b7588;font-size:13px}
 .row{display:flex;gap:8px;flex-wrap:wrap}
 .cell{text-align:center}
 .cell .lab{font-size:12px;color:#7b7588;margin-top:-6px}
 .cell .cue{font-size:13px;font-weight:600}
 .body line{stroke:#2a2635;fill:none} .head{fill:#2a2635} .hand{fill:#4b45a8}
 .shadow{fill:#1c1a24} .axis{stroke:#4b45a8;stroke-width:.6;opacity:.16}
 .rew{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;
      background:#fff;border:1.5px solid #ddd6cd;border-radius:16px;padding:18px}
 .rew figure{margin:0;text-align:center;font-size:12px;color:#55505f}
 .chip{display:inline-block;width:10px;height:10px;border-radius:50%;vertical-align:-1px}
</style>
<h1>Dance Break — contact sheet</h1>
<p class="sub">Every move at ${SAMPLES} points in its loop, drawn by js/skeleton.js — the same module the app renders from. The faint line is the body's centre.</p>`;

for (const style of STYLES) {
  html += `<h2><span class="chip" style="background:${STYLE_COLOR[style.id]}"></span> ${style.name}</h2>`;
  html += `<p class="sub">${style.bpm} bpm — ${style.blurb}</p>`;
  for (const move of style.moves) {
    html += `<div class="move"><div class="mh"><b>${move.name}</b>
      <span class="meta">${move.beats} beats · ${move.frames.length} keyframes · ${move.space}</span></div><div class="row">`;
    for (let i = 0; i < SAMPLES; i++) {
      const beat = (i / SAMPLES) * move.beats;
      const cueIdx = Math.floor(beat) % move.beats;
      html += `<div class="cell">${dancerSVG({ ...move, styleId: style.id }, beat)}
        <div class="cue">${move.cues[cueIdx]}</div>
        <div class="lab">beat ${(beat + 1).toFixed(2)}</div></div>`;
    }
    html += `</div></div>`;
  }
}

html += `<h2>Rewards</h2><p class="sub">The first 12 in order. Deterministic — no randomness, no gamble. Every fifth is a statue frozen in the move it was earned with.</p><div class="rew">`;
const allMoves = STYLES.flatMap((s) => s.moves.map((m) => ({ ...m, styleId: s.id })));
for (let n = 1; n <= 12; n++) {
  const mv = allMoves[(n * 3) % allMoves.length];
  const r = rewardFor(n, mv);
  html += `<figure>${rewardSVG(r, mv, r.kind === 'statue' ? 78 : 64)}
    <figcaption>${n}. ${rewardTitle(r)}<br>${r.kind === 'statue' ? mv.name : ''}</figcaption></figure>`;
}
html += `</div>`;

const out = join(HERE, 'sheet.html');
writeFileSync(out, html);
console.log('wrote ' + out);
console.log(STYLES.reduce((a, s) => a + s.moves.length, 0) + ' moves, ' + SAMPLES + ' samples each');
