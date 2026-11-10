'use strict';

// Efectos de sonido sintetizados (sin música). Se activa tras la primera tecla/clic.
const Sound = {
  ctx: null,
  master: null,
  muted: false,
  eng: null,

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    } catch (e) { this.ctx = null; }
  },

  tone(freq, dur, type, vol, slide) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  },

  noise(dur, vol, freq) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 800;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t);
  },

  move() { this.tone(520, 0.05, 'square', 0.06); },
  select() { this.tone(660, 0.07, 'square', 0.08); this.tone(990, 0.1, 'square', 0.05); },
  error() { this.tone(140, 0.18, 'square', 0.1); },
  beep() { this.tone(440, 0.18, 'square', 0.12); },
  go() { this.tone(880, 0.45, 'square', 0.12); },
  bump() { this.noise(0.12, 0.25, 500); },
  crash() { this.noise(0.45, 0.4, 350); this.tone(110, 0.35, 'sawtooth', 0.12, -60); },
  cone() { this.noise(0.1, 0.2, 1500); this.tone(300, 0.1, 'square', 0.05, 200); },
  skid() { this.noise(0.6, 0.15, 3000); },
  nitro() { this.noise(0.7, 0.18, 1400); this.tone(180, 0.7, 'sawtooth', 0.06, 500); },
  lap() { this.tone(660, 0.1); setTimeout(() => this.tone(880, 0.18), 110); },
  finish() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'square', 0.1), i * 140)); },

  startEngine() {
    if (!this.ctx || this.eng) return;
    const o = this.ctx.createOscillator(), o2 = this.ctx.createOscillator();
    const f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    o.type = 'sawtooth'; o2.type = 'square';
    f.type = 'lowpass'; f.frequency.value = 700;
    g.gain.value = 0;
    o.connect(f); o2.connect(f); f.connect(g); g.connect(this.master);
    o.start(); o2.start();
    this.eng = { o, o2, f, g };
  },

  updateEngine(sp) {
    if (!this.eng) return;
    const t = this.ctx.currentTime;
    if (sp == null || this.muted) { this.eng.g.gain.setTargetAtTime(0, t, 0.05); return; }
    const gears = 5, x = Math.min(sp, 1.3) * gears;
    const gear = Math.min(gears - 1, Math.floor(x));
    const rpm = x - gear;
    const freq = 55 + rpm * 110 + gear * 12;
    this.eng.o.frequency.setTargetAtTime(freq, t, 0.04);
    this.eng.o2.frequency.setTargetAtTime(freq * 0.5, t, 0.04);
    this.eng.g.gain.setTargetAtTime(0.045, t, 0.1);
  },

  stopEngine() {
    if (!this.eng) return;
    try { this.eng.o.stop(); this.eng.o2.stop(); } catch (e) { /* ya detenido */ }
    this.eng = null;
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  },
};
