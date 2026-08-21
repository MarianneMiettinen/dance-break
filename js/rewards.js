// Medals and statues.
//
// Two deliberate constraints, both from audience.md:
//
// 1. Nothing here is ever lost. A collection accumulates; a streak breaks. "They've
//    already failed" is triggered by streaks and milestones, not by owning things.
//    There is no counter of what you missed and no empty slot implying a gap.
// 2. Materials are DETERMINISTIC, never random. A variable-ratio reward is a slot
//    machine, and a slot machine is a dark pattern — especially for this audience.
//    You can see exactly what the next one will be.

import { solve } from './skeleton.js';
import { poseAt } from './skeleton.js';

export const QUALIFY_MS = 3 * 60_000;   // three minutes of actual dancing
export const STATUE_EVERY = 5;

const MATERIALS = {
  bronze:   { hi: '#e0a970', lo: '#8d5a26', edge: '#5f3a13', name: 'Bronze' },
  copper:   { hi: '#f0a67f', lo: '#a2542f', edge: '#6f3418', name: 'Copper' },
  silver:   { hi: '#eef1f5', lo: '#9aa3ad', edge: '#6b737d', name: 'Silver' },
  gold:     { hi: '#f7dd8a', lo: '#c9992a', edge: '#8d6714', name: 'Gold' },
  jade:     { hi: '#a8e0c2', lo: '#3f8f6b', edge: '#27614a', name: 'Jade' },
  amethyst: { hi: '#d5c2f2', lo: '#7a5bbd', edge: '#513a85', name: 'Amethyst' },
  sky:      { hi: '#bcdcf5', lo: '#4a89bd', edge: '#2f5f88', name: 'Sky' },
  coral:    { hi: '#f7c3ad', lo: '#c4704f', edge: '#8a472e', name: 'Coral' },
  slate:    { hi: '#c3c9d4', lo: '#697485', edge: '#454e5c', name: 'Slate' },
  pearl:    { hi: '#fdfaf4', lo: '#ded3c2', edge: '#a89986', name: 'Pearl' },
  marble:   { hi: '#fbf8f3', lo: '#d3ccc0', edge: '#9d9484', name: 'Marble' },
  obsidian: { hi: '#6d6a7d', lo: '#26232f', edge: '#131118', name: 'Obsidian' },
};

const MEDAL_ORDER = ['bronze', 'copper', 'silver', 'jade', 'sky', 'coral', 'slate', 'amethyst', 'pearl', 'gold'];
const STATUE_ORDER = ['bronze', 'marble', 'jade', 'amethyst', 'gold', 'obsidian', 'copper', 'silver'];

export const STYLE_COLOR = {
  hiphop: '#5b57c9',
  latin: '#c2701c',
  disco: '#a94a94',
};

// n is the 1-based count of qualifying breaks, ever.
export function rewardFor(n, move) {
  const isStatue = n % STATUE_EVERY === 0;
  const material = isStatue
    ? STATUE_ORDER[(Math.floor(n / STATUE_EVERY) - 1) % STATUE_ORDER.length]
    : MEDAL_ORDER[(n - 1 - Math.floor((n - 1) / STATUE_EVERY)) % MEDAL_ORDER.length];
  return {
    n,
    kind: isStatue ? 'statue' : 'medal',
    material,
    styleId: move.styleId,
    moveId: move.id,
    moveName: move.name,
    at: new Date().toISOString(),
  };
}

// What you get next. Shown plainly, so nothing is a gamble.
export function previewNext(n) {
  const next = n + 1;
  const isStatue = next % STATUE_EVERY === 0;
  const material = isStatue
    ? STATUE_ORDER[(Math.floor(next / STATUE_EVERY) - 1) % STATUE_ORDER.length]
    : MEDAL_ORDER[(next - 1 - Math.floor((next - 1) / STATUE_EVERY)) % MEDAL_ORDER.length];
  return { kind: isStatue ? 'statue' : 'medal', material, label: MATERIALS[material].name };
}

export const materialName = (m) => (MATERIALS[m] || MATERIALS.bronze).name;

export function rewardTitle(r) {
  return materialName(r.material) + ' ' + (r.kind === 'statue' ? 'statue' : 'medal');
}

function grad(id, m) {
  return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0.4" y2="1">'
    + '<stop offset="0" stop-color="' + m.hi + '"/>'
    + '<stop offset="0.55" stop-color="' + m.lo + '"/>'
    + '<stop offset="1" stop-color="' + m.edge + '"/></linearGradient>';
}

let uid = 0;

export function medalSVG(reward, size = 96) {
  const m = MATERIALS[reward.material] || MATERIALS.bronze;
  const ribbon = STYLE_COLOR[reward.styleId] || '#5b57c9';
  const id = 'mg' + (uid++);
  return `<svg viewBox="0 0 100 128" width="${size}" height="${size * 1.28}" role="img" aria-label="${rewardTitle(reward)} for ${reward.moveName}">
<defs>${grad(id, m)}</defs>
<path d="M32 4 L50 46 L68 4 L84 4 L60 52 L40 52 L16 4 Z" fill="${ribbon}"/>
<path d="M32 4 L50 46 L41 46 L23 4 Z" fill="#000" opacity=".16"/>
<circle cx="50" cy="86" r="36" fill="url(#${id})"/>
<circle cx="50" cy="86" r="36" fill="none" stroke="${m.edge}" stroke-width="2.5"/>
<circle cx="50" cy="86" r="27" fill="none" stroke="${m.edge}" stroke-width="1.5" opacity=".55"/>
<circle cx="38" cy="73" r="11" fill="#fff" opacity=".22"/>
<text x="50" y="93" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="700" fill="${m.edge}" opacity=".85">${reward.n}</text>
</svg>`;
}

export function statueSVG(reward, move, size = 96) {
  const m = MATERIALS[reward.material] || MATERIALS.bronze;
  const id = 'sg' + (uid++);
  // The statue is frozen in the first keyframe of the move it was earned for, so no
  // two statues of different moves look alike.
  const s = solve(poseAt(move, 0, true));
  const seg = s.segments
    .map((g) => `<line x1="${g.a[0].toFixed(1)}" y1="${g.a[1].toFixed(1)}" x2="${g.b[0].toFixed(1)}" y2="${g.b[1].toFixed(1)}" stroke-width="${g.w}" stroke-linecap="round"/>`)
    .join('');
  const hands = s.hands.map((h) => `<circle cx="${h.x.toFixed(1)}" cy="${h.y.toFixed(1)}" r="5.5"/>`).join('');
  return `<svg viewBox="0 0 200 330" width="${size}" height="${size * 1.65}" role="img" aria-label="${rewardTitle(reward)} of ${reward.moveName}">
<defs>${grad(id, m)}</defs>
<g stroke="url(#${id})" fill="url(#${id})">${seg}${hands}<circle cx="${s.head.x.toFixed(1)}" cy="${s.head.y.toFixed(1)}" r="${s.head.r}" stroke="none"/></g>
<rect x="42" y="262" width="116" height="14" rx="3" fill="${m.lo}"/>
<rect x="34" y="276" width="132" height="30" rx="4" fill="url(#${id})"/>
<rect x="34" y="276" width="132" height="30" rx="4" fill="none" stroke="${m.edge}" stroke-width="2"/>
<rect x="28" y="306" width="144" height="12" rx="3" fill="${m.edge}"/>
<text x="100" y="297" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="650" fill="${m.edge}">${reward.moveName}</text>
</svg>`;
}

export function rewardSVG(reward, move, size = 96) {
  return reward.kind === 'statue' ? statueSVG(reward, move, size) : medalSVG(reward, size);
}
