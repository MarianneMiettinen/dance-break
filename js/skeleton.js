// Pure forward kinematics. No DOM. Turns a pose into line/circle coordinates.
//
// Kept DOM-free on purpose: the browser renderer (figure.js) and the offline
// contact-sheet generator (tools/sheet.mjs) must agree exactly, and the only way to
// guarantee that is to have one implementation of the maths.

export const GEO = {
  hipY: 172,
  shoulderY: 108,
  cx: 100,
  hipHalf: 15,
  shoulderHalf: 21,
  headR: 17,
  headGap: 26,
  upperArm: 30,
  foreArm: 29,
  thigh: 40,
  shin: 40,
  footLen: 13,
  groundY: 268,
};

export const VIEWBOX = '0 0 200 300';

const rad = (d) => (d * Math.PI) / 180;

function rot(x, y, px, py, deg) {
  const a = rad(deg);
  const dx = x - px, dy = y - py;
  return [px + dx * Math.cos(a) - dy * Math.sin(a), py + dx * Math.sin(a) + dy * Math.cos(a)];
}

// Limb angle 0 points straight down; positive swings toward screen right.
function project(x, y, deg, len) {
  return [x + len * Math.sin(rad(deg)), y + len * Math.cos(rad(deg))];
}

// side: +1 screen-right, -1 screen-left. Joint bend always folds toward the midline,
// which is what a knee and an elbow do seen from the front.
function chain(root, [angle, bend], side, upLen, loLen) {
  const joint = project(root[0], root[1], angle, upLen);
  const end = project(joint[0], joint[1], angle - side * bend, loLen);
  return { joint, end };
}

export function solve(p) {
  const { cx, hipY, shoulderY } = GEO;
  const hipC = [cx + p.shift, hipY + p.bob];

  // + hip means the RIGHT hip rises, so the line rotates by -hip.
  const hipR = rot(hipC[0] + GEO.hipHalf, hipC[1], hipC[0], hipC[1], -p.hip);
  const hipL = rot(hipC[0] - GEO.hipHalf, hipC[1], hipC[0], hipC[1], -p.hip);

  const shC = rot(cx + p.shift, shoulderY + p.bob, hipC[0], hipC[1], p.lean);
  // + sh drops the RIGHT shoulder; the torso lean rides on top of it.
  const shR = rot(shC[0] + GEO.shoulderHalf, shC[1], shC[0], shC[1], p.sh + p.lean);
  const shL = rot(shC[0] - GEO.shoulderHalf, shC[1], shC[0], shC[1], p.sh + p.lean);

  const head = rot(shC[0], shC[1] - GEO.headGap, shC[0], shC[1], p.lean + p.head);

  const legR = chain(hipR, p.legR, 1, GEO.thigh, GEO.shin);
  const legL = chain(hipL, p.legL, -1, GEO.thigh, GEO.shin);
  const armR = chain(shR, p.armR, 1, GEO.upperArm, GEO.foreArm);
  const armL = chain(shL, p.armL, -1, GEO.upperArm, GEO.foreArm);

  return {
    // Painting order matters: legs behind, arms in front.
    segments: [
      { k: 'thighL', a: hipL, b: legL.joint, w: 11, cls: 'fig-limb' },
      { k: 'shinL', a: legL.joint, b: legL.end, w: 10, cls: 'fig-limb' },
      { k: 'footL', a: legL.end, b: [legL.end[0] - GEO.footLen, legL.end[1] + 1], w: 9, cls: 'fig-limb' },
      { k: 'thighR', a: hipR, b: legR.joint, w: 11, cls: 'fig-limb' },
      { k: 'shinR', a: legR.joint, b: legR.end, w: 10, cls: 'fig-limb' },
      { k: 'footR', a: legR.end, b: [legR.end[0] + GEO.footLen, legR.end[1] + 1], w: 9, cls: 'fig-limb' },
      { k: 'hips', a: hipL, b: hipR, w: 14, cls: 'fig-torso' },
      { k: 'spine', a: hipC, b: shC, w: 20, cls: 'fig-torso' },
      { k: 'shoulders', a: shL, b: shR, w: 13, cls: 'fig-torso' },
      { k: 'upperL', a: shL, b: armL.joint, w: 10, cls: 'fig-limb' },
      { k: 'foreL', a: armL.joint, b: armL.end, w: 9, cls: 'fig-limb' },
      { k: 'upperR', a: shR, b: armR.joint, w: 10, cls: 'fig-limb' },
      { k: 'foreR', a: armR.joint, b: armR.end, w: 9, cls: 'fig-limb' },
    ],
    head: { x: head[0], y: head[1], r: GEO.headR },
    hands: [{ x: armL.end[0], y: armL.end[1] }, { x: armR.end[0], y: armR.end[1] }],
    shadow: {
      cx: GEO.cx + p.shift * 0.7,
      cy: GEO.groundY,
      rx: 46 - Math.abs(p.shift) * 0.15,
      ry: 7,
      opacity: 0.16 + p.bob * 0.006,
    },
  };
}

const NUM_KEYS = ['shift', 'bob', 'lean', 'sh', 'hip', 'head'];
const PAIR_KEYS = ['armR', 'armL', 'legR', 'legL'];
const lerp = (a, b, t) => a + (b - a) * t;

// Interpolate a move's keyframes at any position in its loop.
// `snap` returns the nearest previous keyframe instead — the reduced-motion path.
export function poseAt(move, beatPos, snap = false) {
  const frames = move.frames;
  const loop = move.beats;
  const t = ((beatPos % loop) + loop) % loop;

  let i = 0;
  for (let k = 0; k < frames.length; k++) if (frames[k][0] <= t) i = k;
  const [tA, a] = frames[i];
  const next = frames[(i + 1) % frames.length];
  const b = next[1];
  // The last frame wraps to the first, so its span runs to the end of the loop.
  const span = (next[0] > tA ? next[0] : next[0] + loop) - tA;
  const raw = span > 0 ? (t - tA) / span : 0;

  if (snap) return a;

  // Ease in-out, so the figure settles ON the beat instead of sliding through it.
  const f = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;

  const out = {};
  for (const k of NUM_KEYS) out[k] = lerp(a[k], b[k], f);
  for (const k of PAIR_KEYS) out[k] = [lerp(a[k][0], b[k][0], f), lerp(a[k][1], b[k][1], f)];
  return out;
}
