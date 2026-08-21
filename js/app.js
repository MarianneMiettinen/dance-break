import { STYLES, findMove, referenceSearchUrl } from './data.js';
import { Figure, poseAt } from './figure.js';
import { DanceAudio } from './audio.js';
import { Schedule, describe, newId, untilText, DAY_NAMES, DAY_LONG } from './schedule.js';
import { rewardFor, rewardSVG, rewardTitle, previewNext, QUALIFY_MS, STATUE_EVERY } from './rewards.js';

const $ = (id) => document.getElementById(id);
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const KEY = 'dancebreak.v2';

// ---------------------------------------------------------------- state

const defaults = {
  entries: [],          // {id, time:'14:00', days:[1..]}
  remindersOn: false,
  breakSec: 180,
  styles: STYLES.map((s) => s.id),
  muted: false,
  rate: 1,
  queues: {},
  rewards: [],          // earned, newest last
  qualified: 0,         // count of breaks that reached three minutes
  firedSlots: [],
};

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch { return { ...defaults }; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
}

// ---------------------------------------------------------------- move rotation

const shuffle = (a) => {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

function nextMove() {
  const on = state.styles.length ? state.styles : STYLES.map((s) => s.id);
  const styleId = on[Math.floor(Math.random() * on.length)];
  const style = STYLES.find((s) => s.id === styleId);
  let q = state.queues[styleId];
  if (!Array.isArray(q) || q.length === 0) q = shuffle(style.moves.map((m) => m.id));
  const id = q.shift();
  state.queues[styleId] = q;
  save();
  return findMove(id);
}

// ---------------------------------------------------------------- engines

const audio = new DanceAudio();
audio.setMuted(state.muted);
const figure = new Figure($('figure'));

let move = null;
let raf = null;
let lastBeat = -1;
let hasPlayed = false;      // has this break ever been started
let dancedMs = 0;           // time actually spent playing, this break
let dancedSince = null;

// ---------------------------------------------------------------- break clock

let breakEndsAt = null;
let breakLeftMs = state.breakSec * 1000;
let breakTicker = null;

const fmt = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};

function dancedTotal() {
  return dancedMs + (dancedSince ? Date.now() - dancedSince : 0);
}

function startBreakClock() {
  breakEndsAt = Date.now() + breakLeftMs;
  dancedSince = Date.now();
  clearInterval(breakTicker);
  breakTicker = setInterval(tickBreak, 250);
  tickBreak();
}

function pauseBreakClock() {
  if (breakEndsAt) breakLeftMs = Math.max(0, breakEndsAt - Date.now());
  if (dancedSince) { dancedMs += Date.now() - dancedSince; dancedSince = null; }
  breakEndsAt = null;
  clearInterval(breakTicker);
  breakTicker = null;
  tickBreak();
}

function tickBreak() {
  const left = breakEndsAt ? Math.max(0, breakEndsAt - Date.now()) : breakLeftMs;
  const total = state.breakSec * 1000;
  $('timefill').style.transform = 'scaleX(' + (1 - left / total).toFixed(4) + ')';
  $('timelabel').textContent = left > 0
    ? fmt(left) + ' left. Stop whenever you like.'
    : 'Time is up whenever you are.';
  if (left <= 0 && breakEndsAt) finishBreak(true);
}

// ---------------------------------------------------------------- render loop

function paintOnce() {
  const pos = audio.beatPosition();
  const playing = pos !== null;
  const beatPos = playing ? pos : 0;
  const beat = ((Math.floor(beatPos) % move.beats) + move.beats) % move.beats;

  figure.apply(poseAt(move, beatPos, REDUCED));

  if (beat !== lastBeat) {
    lastBeat = beat;
    const dots = $('counts').children;
    for (let i = 0; i < dots.length; i++) dots[i].classList.toggle('on', playing && i === beat);
    if (playing) {
      $('cue').textContent = move.cues[beat];
      $('cue').classList.remove('idle');
      const items = $('steps').children;
      if (items.length === move.beats) {
        for (let i = 0; i < items.length; i++) items[i].classList.toggle('on', i === beat);
      }
    }
  }
}

function paint() { paintOnce(); raf = requestAnimationFrame(paint); }
function stopPaint() { if (raf) cancelAnimationFrame(raf); raf = null; }

// ---------------------------------------------------------------- screens

const SCREENS = ['home', 'break', 'done', 'cupboard'];
function show(which) {
  for (const id of SCREENS) $('screen-' + id).hidden = id !== which;
}

function loadMove(m) {
  move = m;
  lastBeat = -1;
  $('break-style').textContent = m.styleName;
  $('break-move').textContent = m.name;
  $('break-space').textContent = m.space;
  $('note').textContent = m.note;
  $('reference').href = referenceSearchUrl(m);

  const counts = $('counts');
  counts.textContent = '';
  for (let i = 0; i < m.beats; i++) {
    const d = document.createElement('div');
    d.className = 'count';
    d.textContent = i + 1;
    counts.appendChild(d);
  }

  const steps = $('steps');
  steps.textContent = '';
  for (const s of m.steps) {
    const li = document.createElement('li');
    li.textContent = s;
    steps.appendChild(li);
  }

  const desc = m.name + ', ' + m.styleName + '. ' + m.steps.join(' ');
  figure.setLabel(desc);
  $('figure-desc').textContent = desc;
  figure.apply(poseAt(m, 0, true));
}

function openBreak(m) {
  loadMove(m || nextMove());
  breakLeftMs = state.breakSec * 1000;
  breakEndsAt = null;
  dancedMs = 0;
  dancedSince = null;
  hasPlayed = false;
  audio.stop();
  $('play').textContent = 'Play';
  $('cue').textContent = 'Press play when you’re up.';
  $('cue').classList.add('idle');
  for (const d of $('counts').children) d.classList.remove('on');
  tickBreak();
  show('break');
  document.title = 'Dance Break';
  stopPaint();
  paint();
  $('play').focus();
}

async function setPlaying(on) {
  if (on) {
    hasPlayed = true;
    await audio.start(move.styleId, move.bpm * state.rate);
    startBreakClock();
    $('play').textContent = 'Pause';
  } else {
    audio.stop();
    pauseBreakClock();
    $('play').textContent = 'Play';
    lastBeat = -1;
    for (const d of $('counts').children) d.classList.remove('on');
    for (const li of $('steps').children) li.classList.remove('on');
    $('cue').textContent = 'Paused. Start again when you’re ready.';
    $('cue').classList.add('idle');
  }
}

// ---------------------------------------------------------------- ending a break

function endBreakBookkeeping() {
  if (dancedSince) { dancedMs += Date.now() - dancedSince; dancedSince = null; }
  audio.fadeOut(700);
  clearInterval(breakTicker);
  breakTicker = null;
  breakEndsAt = null;
  stopPaint();
}

// ranOut: the clock reached zero, rather than the user pressing Continue.
function finishBreak(ranOut) {
  const danced = dancedTotal();
  endBreakBookkeeping();

  const earned = danced >= QUALIFY_MS;
  let reward = null;
  if (earned) {
    state.qualified += 1;
    reward = rewardFor(state.qualified, move);
    state.rewards.push(reward);
    save();
  }
  showDone(reward, danced, ranOut);
  refreshHome();
}

function showDone(reward, danced, ranOut) {
  const art = $('reward-art');
  if (reward) {
    art.innerHTML = rewardSVG(reward, findMove(reward.moveId), reward.kind === 'statue' ? 120 : 130);
    art.hidden = false;
    $('done-title').textContent = reward.kind === 'statue'
      ? 'A statue.'
      : 'A ' + rewardTitle(reward).toLowerCase() + '.';
    $('done-line').textContent = reward.kind === 'statue'
      ? 'Number ' + reward.n + ', holding the ' + reward.moveName + '. It is in the cupboard.'
      : 'Number ' + reward.n + ', for the ' + reward.moveName + '. It is in the cupboard.';
    $('done-cupboard').hidden = false;
  } else {
    art.innerHTML = '';
    art.hidden = true;
    $('done-title').textContent = ranOut ? 'That’s the three minutes.' : 'That’s it.';
    $('done-line').textContent = danced > 0
      ? 'Nothing to log. Your legs know you did it.'
      : 'Nothing to log. It’s here when you want it.';
    $('done-cupboard').hidden = true;
  }
  show('done');
  $('done-back').focus();
}

// ---------------------------------------------------------------- schedule

const schedule = new Schedule((entry) => {
  const m = nextMove();
  notify(m.name, entry);
  pendingMove = m;
  document.title = '● Dance break — ' + m.name;
  // Stage 1 cannot open itself with no tab open; Stage 2's extension can. If the tab
  // is in front, take it. If it is not, wait rather than ambush.
  if (!document.hidden && $('screen-break').hidden) { pendingMove = null; openBreak(m); }
  refreshHome();
});

let pendingMove = null;

function notify(moveName) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const n = new Notification('Dance break', { body: moveName + '. Three minutes, then back.', tag: 'dance-break' });
  n.onclick = () => { window.focus(); n.close(); };
}

async function askNotify() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try { return await Notification.requestPermission(); } catch { return 'denied'; }
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && pendingMove && $('screen-break').hidden) {
    const m = pendingMove;
    pendingMove = null;
    openBreak(m);
  }
});

// ---------------------------------------------------------------- home: entries

let draftDays = [];

function renderEntries() {
  const ul = $('entries');
  ul.textContent = '';
  for (const e of state.entries) {
    const li = document.createElement('li');
    li.className = 'entry';

    const info = document.createElement('div');
    info.innerHTML = '<span class="etime">' + e.time + '</span><span class="edays">'
      + describe(e) + '</span>';

    const rm = document.createElement('button');
    rm.className = 'btn-quiet btn-sm';
    rm.textContent = 'Remove';
    rm.setAttribute('aria-label', 'Remove the ' + e.time + ' break on ' + describe(e));
    rm.addEventListener('click', () => {
      state.entries = state.entries.filter((x) => x.id !== e.id);
      schedule.setEntries(state.entries);
      save();
      renderEntries();
      refreshHome();
    });

    li.append(info, rm);
    ul.appendChild(li);
  }
  $('entries-empty').hidden = state.entries.length > 0;
  $('clear-all').hidden = state.entries.length === 0;

  // The advice changes with what is already set, rather than nagging at a fixed line.
  const n = state.entries.length;
  const slots = state.entries.reduce((a, e) => a + e.days.length, 0);
  $('advice').textContent = n === 0
    ? 'Start with one break a week. Once that one sticks by itself, add another.'
    : slots <= 2
      ? 'One or two a week is a good place to stay for a while.'
      : slots <= 5
        ? 'That is a rhythm. Add more only if these are already happening.'
        : 'That is a lot of breaks. Keeping the ones that stick beats adding more.';
}

function buildDayPicker() {
  const wrap = $('day-picker');
  // Monday-first, which is what a week looks like here.
  for (const d of [1, 2, 3, 4, 5, 6, 0]) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'day';
    b.textContent = DAY_NAMES[d].slice(0, 2);
    b.setAttribute('aria-label', DAY_LONG[d]);
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      const i = draftDays.indexOf(d);
      if (i >= 0) draftDays.splice(i, 1); else draftDays.push(d);
      b.setAttribute('aria-pressed', String(draftDays.includes(d)));
      $('add-error').textContent = '';
    });
    wrap.appendChild(b);
  }
}

$('add-entry').addEventListener('click', () => {
  const time = $('new-time').value;
  if (!time) { $('add-error').textContent = 'Pick a time first.'; return; }
  if (!draftDays.length) { $('add-error').textContent = 'Pick at least one day.'; return; }
  const dup = state.entries.find((e) => e.time === time
    && e.days.slice().sort().join() === draftDays.slice().sort().join());
  if (dup) { $('add-error').textContent = 'That one is already in the list.'; return; }

  state.entries.push({ id: newId(), time, days: draftDays.slice() });
  state.entries.sort((a, b) => a.time.localeCompare(b.time));
  schedule.setEntries(state.entries);
  save();

  draftDays = [];
  for (const b of $('day-picker').children) b.setAttribute('aria-pressed', 'false');
  $('add-error').textContent = '';
  renderEntries();
  refreshHome();
});

$('clear-all').addEventListener('click', () => {
  state.entries = [];
  schedule.setEntries([]);
  save();
  renderEntries();
  refreshHome();
});

// ---------------------------------------------------------------- cupboard

function renderCupboard() {
  const grid = $('shelves');
  grid.textContent = '';
  const items = state.rewards.slice().reverse();

  for (const r of items) {
    const cell = document.createElement('figure');
    cell.className = 'shelf-item ' + r.kind;
    cell.innerHTML = rewardSVG(r, findMove(r.moveId), r.kind === 'statue' ? 74 : 62);
    const cap = document.createElement('figcaption');
    const d = new Date(r.at);
    cap.innerHTML = '<b>' + rewardTitle(r) + '</b><br>' + r.moveName + '<br><span class="when">'
      + d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + '</span>';
    cell.appendChild(cap);
    grid.appendChild(cell);
  }

  const medals = state.rewards.filter((r) => r.kind === 'medal').length;
  const statues = state.rewards.length - medals;
  $('cupboard-summary').textContent = state.rewards.length === 0
    ? 'Nothing in here yet. It fills three minutes at a time.'
    : medals + (medals === 1 ? ' medal' : ' medals')
      + (statues ? ' and ' + statues + (statues === 1 ? ' statue' : ' statues') : '') + '.';

  const nx = previewNext(state.qualified);
  const toStatue = STATUE_EVERY - (state.qualified % STATUE_EVERY);
  $('next-reward').textContent = 'Next one is a ' + nx.label.toLowerCase() + ' ' + nx.kind + '.'
    + (nx.kind === 'medal' ? ' A statue after ' + toStatue + ' more.' : '');
  $('cupboard-count').textContent = state.rewards.length;
}

// ---------------------------------------------------------------- home refresh

function refreshHome() {
  const on = schedule.enabled;
  $('toggle-reminders').textContent = on ? 'Turn off' : 'Turn on';
  $('toggle-reminders').setAttribute('aria-pressed', String(on));

  if (pendingMove) {
    $('next-status').textContent = 'A break is waiting: ' + pendingMove.name + '.';
  } else if (!on) {
    $('next-status').textContent = state.entries.length
      ? 'Reminders are off. Your times are kept.'
      : 'Reminders are off.';
  } else if (!state.entries.length) {
    $('next-status').textContent = 'On, but no times set yet.';
  } else {
    const nx = schedule.nextOccurrence();
    $('next-status').textContent = nx
      ? 'Next break ' + untilText(nx) + ', at ' + nx.toTimeString().slice(0, 5) + '.'
      : 'On.';
  }
  $('cupboard-count').textContent = state.rewards.length;
  if (!pendingMove) document.title = 'Dance Break';
}

// ---------------------------------------------------------------- wiring

function segment(el, attr, current, onPick) {
  const buttons = [...el.querySelectorAll('button')];
  const sync = (v) => buttons.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset[attr]) === Number(v))));
  buttons.forEach((b) => b.addEventListener('click', () => { sync(Number(b.dataset[attr])); onPick(Number(b.dataset[attr])); }));
  sync(current);
}

segment($('length-seg'), 'sec', state.breakSec, (v) => { state.breakSec = v; save(); });
segment($('speed-seg'), 'rate', state.rate, (v) => {
  state.rate = v; save();
  if (move) audio.setTempo(move.bpm * v);
});

$('toggle-reminders').addEventListener('click', async () => {
  if (schedule.enabled) {
    schedule.stop();
    pendingMove = null;
  } else {
    await askNotify();
    schedule.setEntries(state.entries);
    schedule.start();
  }
  state.remindersOn = schedule.enabled;
  state.firedSlots = schedule.firedList();
  save();
  refreshHome();
});

for (const s of STYLES) {
  const label = document.createElement('label');
  label.className = 'check';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = state.styles.includes(s.id);
  cb.addEventListener('change', () => {
    const set = new Set(state.styles);
    if (cb.checked) set.add(s.id); else set.delete(s.id);
    if (set.size === 0) { cb.checked = true; return; }  // never leave nothing to show
    state.styles = [...set];
    save();
  });
  const txt = document.createElement('span');
  txt.innerHTML = '<span class="cname">' + s.name + '</span><br><span class="cblurb">'
    + s.blurb + ' ' + s.bpm + ' bpm.</span>';
  label.append(cb, txt);
  $('style-checks').appendChild(label);
}

$('dance-now').addEventListener('click', () => { pendingMove = null; openBreak(); });
$('play').addEventListener('click', () => setPlaying(!audio.playing));
$('continue-btn').addEventListener('click', () => finishBreak(false));
$('another').addEventListener('click', async () => {
  const wasPlaying = audio.playing;
  audio.stop();
  loadMove(nextMove());
  if (wasPlaying) await setPlaying(true);
});
$('mute').addEventListener('click', () => {
  state.muted = !state.muted;
  save();
  audio.setMuted(state.muted);
  $('mute').textContent = state.muted ? 'Unmute' : 'Mute';
  $('mute').setAttribute('aria-pressed', String(state.muted));
});

$('done-more').addEventListener('click', () => openBreak());
$('done-back').addEventListener('click', () => { show('home'); refreshHome(); $('dance-now').focus(); });
$('done-cupboard').addEventListener('click', () => { renderCupboard(); show('cupboard'); $('cupboard-back').focus(); });
$('open-cupboard').addEventListener('click', () => { renderCupboard(); show('cupboard'); $('cupboard-back').focus(); });
$('cupboard-back').addEventListener('click', () => { show('home'); refreshHome(); $('open-cupboard').focus(); });

document.addEventListener('keydown', (e) => {
  if (!$('screen-break').hidden) {
    if (e.key === 'Escape') { e.preventDefault(); finishBreak(false); }
    if (e.key === ' ' && !['BUTTON', 'A', 'INPUT'].includes(e.target.tagName)) {
      e.preventDefault();
      setPlaying(!audio.playing);
    }
  } else if (!$('screen-cupboard').hidden && e.key === 'Escape') {
    show('home'); refreshHome(); $('open-cupboard').focus();
  }
});

// ---------------------------------------------------------------- boot

$('mute').textContent = state.muted ? 'Unmute' : 'Mute';
$('mute').setAttribute('aria-pressed', String(state.muted));
buildDayPicker();
renderEntries();
schedule.setEntries(state.entries);
schedule.setFired(state.firedSlots);
if (state.remindersOn) schedule.start();
refreshHome();
setInterval(() => {
  if (!$('screen-home').hidden) refreshHome();
  const f = schedule.firedList();
  if (f.length !== state.firedSlots.length) { state.firedSlots = f; save(); }
}, 15_000);

window.__dance = {
  STYLES, audio, figure, poseAt, state, schedule,
  openBreak, finishBreak, renderCupboard, refreshHome, paintOnce,
  rewardFor, rewardSVG, previewNext, save,
};
