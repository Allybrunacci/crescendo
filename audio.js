/* Crescendo — sound: a synthesised piano, a metronome click and a look-ahead scheduler (Web Audio, no recordings) */
'use strict';

const AU = { ctx: null, out: null, met: null, wave: null, noise: null, live: new Map(), all: new Set(), sustain: false, sustained: new Set(), vol: 0.8, metVol: 0.6, selfUntil: 0, clicks: [] };
// When Crescendo's own sound will have faded (performance.now() ms), so the microphone doesn't mistake it for you.
function selfSound(ctxEnd) {
  const c = AU.ctx;
  const end = performance.now() + Math.max(0, ctxEnd - (c ? c.currentTime : 0)) * 1000 + 400;
  if (end > AU.selfUntil) AU.selfUntil = end;
}

function ac() {
  if (AU.ctx) return AU.ctx;
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C || AU.failed) return null;
  let ctx;
  try { ctx = new C({ latencyHint: 'interactive' }); } catch (e) { AU.failed = true; return null; }
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 14; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.25;
  const out = ctx.createGain();
  out.gain.value = AU.vol;
  out.connect(comp);
  comp.connect(ctx.destination);
  const met = ctx.createGain();
  met.gain.value = AU.metVol;
  met.connect(ctx.destination);
  // A piano-ish tone: strong fundamental, falling harmonics.
  const amps = [0, 1, 0.5, 0.3, 0.2, 0.12, 0.09, 0.06, 0.04, 0.03, 0.02, 0.014, 0.01, 0.007, 0.005, 0.003];
  const re = new Float32Array(amps.length), im = new Float32Array(amps);
  AU.wave = ctx.createPeriodicWave(re, im);
  const len = Math.floor(ctx.sampleRate * 0.05);
  const nb = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = nb.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  AU.noise = nb;
  Object.assign(AU, { ctx, out, met, comp });
  return ctx;
}
// The clock sounds are timed against: the sound clock, or the page's clock in a browser that can't make sound.
const audioNow = () => { const c = ac(); return c ? c.currentTime : performance.now() / 1000; };

/* iPhone and iPad: Safari treats sound made by a web page like a game's background sound, which Silent mode mutes.
   Asking for "playback" (the way music apps play) keeps the piano audible. The microphone needs "play-and-record". */
const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function audioSessionType(type) {
  try { if (navigator.audioSession && navigator.audioSession.type !== type) navigator.audioSession.type = type; } catch (e) { /* not supported */ }
}
audioSessionType('playback');
// iPhones older than iOS 16.4 have no audio-session setting; a silent, looping media element does the same job there.
let quietEl = null;
function silentWavUrl() {
  const n = 4000, v = new DataView(new ArrayBuffer(44 + n * 2));
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 16000, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 2, true);
  return URL.createObjectURL(new Blob([v], { type: 'audio/wav' }));
}
function keepAudible() {
  if (!IOS || navigator.audioSession || document.hidden) return;
  if (!quietEl) {
    quietEl = document.createElement('audio');
    quietEl.setAttribute('x-webkit-airplay', 'deny');
    quietEl.disableRemotePlayback = true;
    quietEl.loop = true;
    quietEl.src = silentWavUrl();
  }
  if (quietEl.paused) quietEl.play().catch(() => {});
}
function unlockAudio() {
  keepAudible();
  const c = ac();
  if (!c) {
    if (!AU.warned && typeof toast === 'function') { AU.warned = true; toast('This browser won’t let Crescendo play sound.'); }
    return;
  }
  if (c.state === 'running') return;
  c.resume().catch(() => {});
  // A one-sample silent sound inside the tap, which some iPhones need before they'll play anything.
  const s = c.createBufferSource();
  s.buffer = c.createBuffer(1, 1, c.sampleRate);
  s.connect(c.destination);
  s.start(0);
}
// On touch screens a tap only counts when the finger lifts, so listen for that as well as presses and keys.
['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach(t => document.addEventListener(t, unlockAudio, { capture: true, passive: true }));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (quietEl) quietEl.pause(); return; }
  if (AU.ctx && AU.ctx.state !== 'running') AU.ctx.resume().catch(() => {});
});
function setVolume(v) { AU.vol = v; if (AU.out) AU.out.gain.setTargetAtTime(v, AU.ctx.currentTime, 0.02); }
function setMetVolume(v) { AU.metVol = v; if (AU.met) AU.met.gain.setTargetAtTime(v, AU.ctx.currentTime, 0.02); }

function voice(m, vel, t) {
  const ctx = AU.ctx, f = freqOf(m);
  const osc = ctx.createOscillator(), osc2 = ctx.createOscillator();
  osc.setPeriodicWave(AU.wave);
  osc2.setPeriodicWave(AU.wave);
  osc.frequency.value = f;
  osc2.frequency.value = f;
  osc2.detune.value = 3.5;
  const g2 = ctx.createGain();
  g2.gain.value = 0.4;
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.Q.value = 0.6;
  const g = ctx.createGain();
  osc.connect(filt);
  osc2.connect(g2);
  g2.connect(filt);
  filt.connect(g);
  g.connect(AU.out);
  const peak = (0.1 + 0.26 * vel) * (m > 84 ? 0.75 : m < 40 ? 1.15 : 1);
  const tau = Math.min(3.2, Math.max(0.28, 2.6 * Math.pow(2, -(m - 45) / 19)));
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.004);
  g.gain.setTargetAtTime(peak * 0.5, t + 0.004, 0.07);
  g.gain.setTargetAtTime(0.00001, t + 0.1, tau);
  const c0 = Math.min(11000, f * (4 + 9 * vel) + 700), c1 = Math.max(f * 2.4, 650);
  filt.frequency.setValueAtTime(c0, t);
  filt.frequency.setTargetAtTime(c1, t + 0.008, 0.4);
  const ns = ctx.createBufferSource();
  ns.buffer = AU.noise;
  const nf = ctx.createBiquadFilter();
  nf.type = 'bandpass';
  nf.frequency.value = Math.min(5000, f * 5 + 400);
  nf.Q.value = 1.1;
  const ng = ctx.createGain();
  ng.gain.value = 0.045 * vel;
  ns.connect(nf);
  nf.connect(ng);
  ng.connect(AU.out);
  ns.start(t);
  osc.start(t);
  osc2.start(t);
  const v = { m, t, g, osc, osc2, end: t + tau * 7 + 0.1 };
  stopAt(v, v.end);
  AU.all.add(v);
  osc.onended = () => AU.all.delete(v);
  return v;
}
function stopAt(v, t) {
  for (const o of [v.osc, v.osc2]) { try { o.stop(t); } catch (e) { /* already stopped */ } }
}
function release(v, t, r) {
  const rel = r || (v.m > 88 ? 0.6 : 0.09);
  try { v.g.gain.cancelScheduledValues(t); } catch (e) { /* ignore */ }
  v.g.gain.setTargetAtTime(0, t, rel);
  stopAt(v, t + rel * 8);
  selfSound(t + rel * 3);
}

/* Live notes (keys held down) */
function noteOn(m, vel = 0.75) {
  const c = ac();
  if (!c) return;
  if (c.state !== 'running') c.resume().catch(() => {});
  const t = c.currentTime;
  const prev = AU.live.get(m);
  if (prev) release(prev, t, 0.03);
  AU.sustained.delete(m);
  AU.live.set(m, voice(m, vel, t));
}
function noteOff(m) {
  const v = AU.live.get(m);
  if (!v) return;
  if (AU.sustain) { AU.sustained.add(m); return; }
  release(v, AU.ctx.currentTime);
  AU.live.delete(m);
}
function setSustain(on) {
  AU.sustain = !!on;
  if (!on) {
    for (const m of AU.sustained) {
      if (typeof IN !== 'undefined' && IN.down.has(m)) continue;
      const v = AU.live.get(m);
      if (v) { release(v, AU.ctx.currentTime); AU.live.delete(m); }
    }
    AU.sustained.clear();
  }
}

/* Scheduled notes (playback) */
function playNote(m, dur = 0.9, when = 0, vel = 0.72) {
  const c = ac();
  if (!c) return null;
  if (c.state !== 'running') c.resume().catch(() => {});
  const t = Math.max(c.currentTime + 0.005, when || c.currentTime + 0.02);
  const v = voice(m, vel, t);
  release(v, t + Math.max(0.05, dur));
  return v;
}
function playChord(ms, dur = 1.2, when = 0, vel = 0.68, spread = 0) {
  const c = ac();
  if (!c) return;
  const t = when || c.currentTime + 0.03;
  ms.forEach((m, i) => playNote(m, dur - i * spread, t + i * spread, vel));
}
function playSeq(list, gap = 0.55, dur = 0.5) {
  const c = ac();
  if (!c) return 0;
  const t = c.currentTime + 0.05;
  list.forEach((x, i) => (Array.isArray(x) ? playChord(x, dur, t + i * gap) : playNote(x, dur, t + i * gap)));
  return list.length * gap;
}
// Silence everything that's playing or waiting to play.
function hush() {
  if (!AU.ctx) return;
  const t = AU.ctx.currentTime;
  for (const v of AU.all) {
    if (v.t > t) { try { v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(0, t); } catch (e) { /* ignore */ } stopAt(v, t + 0.01); } else release(v, t, 0.05);
  }
  AU.all.clear();
  AU.live.clear();
  AU.selfUntil = Math.min(AU.selfUntil, performance.now() + 400);
}

/* Metronome click: 0 = first beat, 1 = beat, 2 = in-between */
const CLICK_HZ = [1760, 1250, 900];
function click(t, kind = 1) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = 'triangle';
  o.frequency.value = CLICK_HZ[kind];
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime([0.9, 0.6, 0.28][kind], t + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g);
  g.connect(AU.met);
  o.start(t);
  o.stop(t + 0.07);
  const at = performance.now() + (t - c.currentTime) * 1000;
  AU.clicks = AU.clicks.filter(x => x > performance.now() - 1000);
  AU.clicks.push(at);
}
// True while a metronome click could still be reaching the microphone.
const clickSounding = now => AU.clicks.some(x => now > x - 10 && now < x + 130);

// Look-ahead scheduler: calls fn(time, item) slightly before each item is due.
// items: [{ at: beats, ... }] sorted; spb = seconds per beat.
function scheduler(items, spb, opts = {}) {
  const lead = opts.lead === undefined ? 0.12 : opts.lead;
  const t0 = audioNow() + lead - (opts.from || 0) * spb;
  let i = 0;
  while (i < items.length && items[i].at < (opts.from || 0) - 1e-9) i++;
  let stopped = false;
  const end = opts.end !== undefined ? opts.end : items.length ? items[items.length - 1].at : 0;
  const tick = () => {
    if (stopped) return;
    const now = audioNow(), horizon = now + 0.16;
    while (i < items.length && t0 + items[i].at * spb < horizon) { const it = items[i++]; opts.fn(t0 + it.at * spb, it); }
    if (i >= items.length && now > t0 + end * spb + 0.05) { api.stop(); if (opts.done) opts.done(); }
  };
  const timer = setInterval(tick, 25);
  const api = {
    t0, spb,
    beat: () => (audioNow() - t0) / spb,
    stop() { if (stopped) return; stopped = true; clearInterval(timer); },
    get stopped() { return stopped; },
  };
  tick();
  return api;
}

// A metronome that runs until stopped. onBeat(beatIndex, sub, time) fires in step with the sound.
function metronome({ bpm = 80, beats = 4, sub = 1, accent = true, countIn = 0, onBeat, onDone } = {}) {
  let spb = 60 / bpm, next = audioNow() + 0.1, n = 0, stopped = false, ended = false;
  const timers = new Set();
  const tick = () => {
    if (stopped || ended) return;
    while (next < audioNow() + 0.15) {
      const beat = Math.floor(n / sub), s = n % sub, inBar = beat % beats, at = next;
      click(at, s ? 2 : inBar === 0 && accent ? 0 : 1);
      if (onBeat) {
        const id = setTimeout(() => { timers.delete(id); if (!stopped) onBeat(beat, s, at); }, Math.max(0, (at - audioNow()) * 1000));
        timers.add(id);
      }
      n++;
      next += spb / sub;
      // After a count-in, stop adding clicks but let the beats already sounding report in.
      if (countIn && n >= countIn * sub) { ended = true; clearInterval(timer); if (onDone) onDone(next); return; }
    }
  };
  const timer = setInterval(tick, 25);
  const api = {
    stop() { stopped = true; clearInterval(timer); timers.forEach(clearTimeout); timers.clear(); },
    set(b) { spb = 60 / b; },
    get next() { return next; },
  };
  tick();
  return api;
}

// Converts an AudioContext time to performance.now() time (for judging taps against the beat).
function ctxToPerf(t) {
  const c = AU.ctx;
  if (!c) return t * 1000;
  const ts = c.getOutputTimestamp ? c.getOutputTimestamp() : null;
  if (ts && ts.performanceTime) return ts.performanceTime + (t - ts.contextTime) * 1000;
  return performance.now() + (t - c.currentTime + (c.outputLatency || c.baseLatency || 0)) * 1000;
}
