// Weekly schedule: a list of {time, days} entries rather than a repeating interval.
//
// This is the seam Stage 2 swaps for chrome.alarms. A web page can only fire while a
// tab is open; the extension can open the break window with nothing running. Same
// interface both sides.

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TICK_MS = 20_000;
// How late a slot may fire. A laptop asleep past its slot wakes to a break it can
// still use; one from four hours ago is just noise.
const GRACE_MS = 5 * 60_000;

export const newId = () => 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function parseTime(t) {
  const [h, m] = t.split(':').map(Number);
  return { h, m };
}

function slotKey(entry, date) {
  return entry.id + '@' + date.toISOString().slice(0, 10) + 'T' + entry.time;
}

export function describe(entry) {
  const d = [...entry.days].sort((a, b) => a - b);
  if (d.length === 7) return 'Every day';
  if (d.length === 5 && d.every((x) => x >= 1 && x <= 5)) return 'Weekdays';
  if (d.length === 2 && d.includes(0) && d.includes(6)) return 'Weekends';
  if (d.length === 1) return DAY_LONG[d[0]] + 's';
  return d.map((x) => DAY_NAMES[x]).join(', ');
}

export class Schedule {
  constructor(onFire) {
    this.onFire = onFire;
    this.entries = [];
    this.fired = new Set();
    this.timer = null;
    this.enabled = false;
  }

  setEntries(entries) {
    this.entries = entries;
    // Drop fire-records for entries that no longer exist.
    const ids = new Set(entries.map((e) => e.id));
    for (const k of [...this.fired]) if (!ids.has(k.split('@')[0])) this.fired.delete(k);
  }

  setFired(list) { this.fired = new Set(list || []); }
  firedList() { return [...this.fired].slice(-60); }

  start() {
    this.enabled = true;
    this.stop(true);
    // Claim every slot already in the past so switching on does not fire immediately.
    this._sweep(true);
    this.timer = setInterval(() => this._sweep(false), TICK_MS);
  }

  stop(keepEnabled = false) {
    if (!keepEnabled) this.enabled = false;
    clearInterval(this.timer);
    this.timer = null;
  }

  // claimOnly: mark past slots as seen without firing them.
  _sweep(claimOnly) {
    if (!this.enabled) return;
    const now = new Date();
    for (const entry of this.entries) {
      if (!entry.days.length) continue;
      const { h, m } = parseTime(entry.time);
      // Check today and yesterday, so a slot just after midnight is not missed.
      for (const back of [0, 1]) {
        const d = new Date(now);
        d.setDate(d.getDate() - back);
        if (!entry.days.includes(d.getDay())) continue;
        d.setHours(h, m, 0, 0);
        const age = now - d;
        if (age < 0) continue;
        const key = slotKey(entry, d);
        if (this.fired.has(key)) continue;
        this.fired.add(key);
        if (!claimOnly && age <= GRACE_MS) { this.onFire(entry); return; }
      }
    }
  }

  // Next scheduled datetime, or null. Scans a week and a day.
  nextOccurrence(from = new Date()) {
    let best = null;
    for (const entry of this.entries) {
      const { h, m } = parseTime(entry.time);
      for (let i = 0; i <= 7; i++) {
        const d = new Date(from);
        d.setDate(d.getDate() + i);
        if (!entry.days.includes(d.getDay())) continue;
        d.setHours(h, m, 0, 0);
        if (d <= from) continue;
        if (!best || d < best) best = d;
        break;
      }
    }
    return best;
  }
}

export function untilText(date, from = new Date()) {
  if (!date) return '';
  const mins = Math.round((date - from) / 60000);
  if (mins < 60) return 'in ' + mins + ' min';
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return 'in ' + hrs + (hrs === 1 ? ' hour' : ' hours');
  const days = Math.round(hrs / 24);
  return days === 1 ? 'tomorrow' : 'in ' + days + ' days';
}

export function hhmm(date) {
  return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
}
