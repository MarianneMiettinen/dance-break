// Web Audio drum machine + bass. One pattern per style, generated in the browser.
//
// Why generated and not a bundled MP3: no licensing to audit, no bytes to ship, no
// network request, works offline, and it shares a clock with the animation so the
// move is always on the beat. It is a groove, not a song — that trade is deliberate.
//
// Patterns are 16 sixteenth-notes per bar. Steps are indices into that grid.

const N = {
  A1: 55.00, C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00,
  A2: 110.0, C3: 130.8, D3: 146.8, E3: 164.8, G3: 196.0, A3: 220.0,
  C4: 261.6, E4: 329.6, A4: 440.0,
};

const PATTERNS = {
  hiphop: {
    swing: 0.14,
    kick: [0, 6, 10],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
    accent: [0, 8],
    bass: [
      [[0, N.A1, 0.5], [6, N.A1, 0.25], [10, N.C2, 0.4], [14, N.E2, 0.3]],
      [[0, N.A1, 0.5], [6, N.G2, 0.25], [10, N.F2, 0.4], [14, N.E2, 0.3]],
    ],
    chord: [
      [[8, [N.C4, N.E4, N.A4], 0.35]],
      [[8, [N.C4, N.E4, N.G3], 0.35]],
    ],
    gain: { kick: 0.95, snare: 0.42, hat: 0.13, bass: 0.36, chord: 0.075 },
  },

  latin: {
    swing: 0,
    kick: [0, 8, 11],
    snare: [],
    hat: [2, 6, 10, 14],
    accent: [2, 10],
    // Son clave, 3-2.
    clave: [0, 3, 6, 10, 12],
    bass: [
      [[3, N.A1, 0.35], [6, N.A2, 0.25], [8, N.E2, 0.4], [11, N.A1, 0.3], [14, N.E2, 0.3]],
      [[3, N.E2, 0.35], [6, N.E3, 0.25], [8, N.D2, 0.4], [11, N.E2, 0.3], [14, N.A1, 0.3]],
    ],
    chord: [
      [[0, [N.A3, N.C4, N.E4], 0.3], [10, [N.A3, N.C4, N.E4], 0.2]],
      [[0, [N.G3, N.C4, N.E4], 0.3], [10, [N.G3, N.C4, N.E4], 0.2]],
    ],
    gain: { kick: 0.7, snare: 0, hat: 0.12, bass: 0.34, chord: 0.09, clave: 0.2 },
  },

  disco: {
    swing: 0,
    kick: [0, 4, 8, 12],
    snare: [4, 12],
    hat: [2, 6, 10, 14],
    openhat: [2, 6, 10, 14],
    accent: [],
    bass: [
      [[0, N.A1, 0.2], [2, N.A2, 0.2], [4, N.A1, 0.2], [6, N.A2, 0.2],
       [8, N.A1, 0.2], [10, N.A2, 0.2], [12, N.A1, 0.2], [14, N.A2, 0.2]],
      [[0, N.F2, 0.2], [2, N.F2 * 2, 0.2], [4, N.F2, 0.2], [6, N.F2 * 2, 0.2],
       [8, N.G2, 0.2], [10, N.G2 * 2, 0.2], [12, N.G2, 0.2], [14, N.G2 * 2, 0.2]],
    ],
    chord: [
      [[0, [N.C4, N.E4, N.A4], 0.22], [6, [N.C4, N.E4, N.A4], 0.18]],
      [[0, [N.C4, N.F2 * 4, N.A4], 0.22], [6, [N.D3 * 2, N.G3 * 2, N.C4], 0.18]],
    ],
    gain: { kick: 0.95, snare: 0.34, hat: 0.1, bass: 0.3, chord: 0.08 },
  },
};

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.12; // seconds

export class DanceAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noise = null;
    this.playing = false;
    this.volume = 0.55;
    this.muted = false;
    this._timer = null;
    this._step = 0;
    this._bar = 0;
    this._nextNoteTime = 0;
    this._startTime = 0;
    this._pausedBeats = 0;
    this.bpm = 100;
    this.style = 'hiphop';
  }

  _ensureCtx() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();

    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;

    // Keeps the bass from clipping on the loud styles.
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    this.master.connect(comp).connect(this.ctx.destination);

    const len = this.ctx.sampleRate * 1.2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
  }

  setVolume(v) {
    this.volume = v;
    if (this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : v, this.ctx.currentTime, 0.02);
    }
  }

  setMuted(m) {
    this.muted = m;
    this.setVolume(this.volume);
  }

  // Effective BPM, after the user's slow-down.
  setTempo(bpm) {
    if (!this.playing) { this.bpm = bpm; return; }
    // Freeze the beat position, then restart the clock at the new tempo.
    const pos = this.beatPosition();
    this.bpm = bpm;
    this._startTime = this.ctx.currentTime - (pos * 60) / bpm;
  }

  async start(styleId, bpm) {
    this._ensureCtx();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.style = styleId;
    this.bpm = bpm;
    this._step = 0;
    this._bar = 0;
    this._nextNoteTime = this.ctx.currentTime + 0.06;
    this._startTime = this._nextNoteTime;
    this.playing = true;
    this._tick();
  }

  stop() {
    this.playing = false;
    clearTimeout(this._timer);
    this._timer = null;
    if (this.master) this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume;
  }

  // Ends a break without a hard cut. No alarm sound, ever.
  fadeOut(ms = 700) {
    if (!this.ctx || !this.playing) { this.stop(); return; }
    this.master.gain.setTargetAtTime(0.0001, this.ctx.currentTime, ms / 3000);
    setTimeout(() => this.stop(), ms + 80);
  }

  // Position in beats since playback began. Drives the animation.
  beatPosition() {
    if (!this.ctx || !this.playing) return null;
    return ((this.ctx.currentTime - this._startTime) * this.bpm) / 60;
  }

  _tick() {
    if (!this.playing) return;
    const secPerStep = 60 / this.bpm / 4;
    const pat = PATTERNS[this.style] || PATTERNS.hiphop;

    while (this._nextNoteTime < this.ctx.currentTime + SCHEDULE_AHEAD) {
      // Swing pushes the off-16ths late. Hip-hop only.
      const isOff = this._step % 2 === 1;
      const t = this._nextNoteTime + (isOff ? pat.swing * secPerStep : 0);
      this._playStep(this._step, this._bar, t, pat, secPerStep);

      this._nextNoteTime += secPerStep;
      this._step++;
      if (this._step >= 16) { this._step = 0; this._bar++; }
    }
    this._timer = setTimeout(() => this._tick(), LOOKAHEAD_MS);
  }

  _playStep(step, bar, t, pat, secPerStep) {
    const g = pat.gain;
    if (pat.kick.includes(step)) this._kick(t, g.kick);
    if (pat.snare && pat.snare.includes(step) && g.snare) this._snare(t, g.snare);
    if (pat.clave && pat.clave.includes(step)) this._clave(t, g.clave);
    if (pat.hat.includes(step)) {
      const open = pat.openhat && pat.openhat.includes(step);
      const lvl = g.hat * (pat.accent.includes(step) ? 1.7 : 1);
      this._hat(t, lvl, open ? 0.16 : 0.045);
    }

    const bassBar = pat.bass[bar % pat.bass.length];
    for (const [s, f, dur] of bassBar) {
      if (s === step) this._bass(t, f, dur * (secPerStep * 4), g.bass);
    }
    const chordBar = pat.chord[bar % pat.chord.length];
    for (const [s, notes, dur] of chordBar) {
      if (s === step) this._chord(t, notes, dur * (secPerStep * 4), g.chord);
    }
  }

  _env(node, t, peak, attack, decay) {
    const g = node.gain;
    g.setValueAtTime(0.0001, t);
    g.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    g.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  _kick(t, lvl) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.09);
    this._env(g, t, lvl, 0.003, 0.28);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.36);
  }

  _noiseSrc(t) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise;
    s.playbackRate.value = 1;
    s.start(t);
    return s;
  }

  _snare(t, lvl) {
    const s = this._noiseSrc(t);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1750;
    bp.Q.value = 0.8;
    const g = this.ctx.createGain();
    this._env(g, t, lvl, 0.002, 0.15);
    s.connect(bp).connect(g).connect(this.master);
    s.stop(t + 0.2);
  }

  _hat(t, lvl, decay) {
    const s = this._noiseSrc(t);
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7800;
    const g = this.ctx.createGain();
    this._env(g, t, lvl, 0.001, decay);
    s.connect(hp).connect(g).connect(this.master);
    s.stop(t + decay + 0.06);
  }

  _clave(t, lvl) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(1180, t);
    o.frequency.exponentialRampToValueAtTime(900, t + 0.04);
    this._env(g, t, lvl, 0.001, 0.06);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.1);
  }

  _bass(t, freq, dur, lvl) {
    const o = this.ctx.createOscillator();
    const lp = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, t);
    lp.frequency.exponentialRampToValueAtTime(320, t + dur);
    lp.Q.value = 3;
    this._env(g, t, lvl, 0.008, Math.max(dur, 0.06));
    o.connect(lp).connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.12);
  }

  _chord(t, freqs, dur, lvl) {
    for (const f of freqs) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      o.detune.value = (Math.random() - 0.5) * 8;
      this._env(g, t, lvl, 0.01, Math.max(dur, 0.08));
      o.connect(g).connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.15);
    }
  }
}
