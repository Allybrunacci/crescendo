/* Crescendo — where notes come from: on-screen keys, the computer keyboard, a MIDI piano, or the microphone */
'use strict';

const IN = { subs: new Set(), chordSubs: new Set(), down: new Set(), keyBase: 60, ears: 0, midi: { status: 'off', names: [], access: null }, mic: { on: false, level: 0, heard: null, chord: null, status: 'off' } };
// iPhone and iPad browsers (and Safari on a Mac) can't talk to MIDI keyboards, so there the microphone does that job.
const MIDI_OK = typeof navigator.requestMIDIAccess === 'function';

// listen = true for exercises that need to hear you play; in microphone mode that starts the microphone,
// and it stops again a few seconds after the last of them finishes.
function onInput(fn, listen = false) {
  IN.subs.add(fn);
  if (!listen) return () => IN.subs.delete(fn);
  IN.ears++;
  clearTimeout(MIC.idle);
  ensureEars();
  let on = true;
  return () => {
    IN.subs.delete(fn);
    if (!on) return;
    on = false;
    if (--IN.ears === 0) MIC.idle = setTimeout(() => { if (!IN.ears && !MIC.manual && IN.mic.on) micStop(); }, 8000);
  };
}
function emitInput(type, m, vel = 0.72, src = 'touch') {
  if (type === 'on') IN.down.add(m); else IN.down.delete(m);
  const sound = src === 'touch' || src === 'keys' || (src === 'midi' && typeof S !== 'undefined' && S.prefs.midiSound);
  if (sound) { if (type === 'on') noteOn(m, vel); else noteOff(m); }
  const ev = { type, m, vel, src, at: performance.now() };
  for (const f of [...IN.subs]) { try { f(ev); } catch (e) { console.error(e); } }
}

/* ---------- computer keyboard: a row of piano keys ---------- */
const KEYMAP = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ';': 16 };
const isTyping = el => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
const keysHeld = new Map();
document.addEventListener('keydown', e => {
  if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
  const k = e.key.toLowerCase();
  if (k === 'z' || k === 'x') {
    IN.keyBase = clamp(IN.keyBase + (k === 'z' ? -12 : 12), 24, 96);
    if (typeof toast === 'function') toast(`Computer keys now start at ${noteFull(spell(IN.keyBase))}`);
    return;
  }
  if (!(k in KEYMAP)) return;
  e.preventDefault();
  const m = IN.keyBase + KEYMAP[k];
  keysHeld.set(k, m);
  emitInput('on', m, 0.75, 'keys');
});
document.addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (!keysHeld.has(k)) return;
  emitInput('off', keysHeld.get(k), 0, 'keys');
  keysHeld.delete(k);
});
window.addEventListener('blur', () => { for (const [k, m] of keysHeld) emitInput('off', m, 0, 'keys'); keysHeld.clear(); });

/* ---------- MIDI (digital pianos and keyboards over USB or Bluetooth) ---------- */
const midiListeners = new Set();
const midiChanged = () => midiListeners.forEach(f => { try { f(IN.midi); } catch (e) { console.error(e); } });
async function midiConnect() {
  if (!navigator.requestMIDIAccess) { IN.midi.status = 'unsupported'; midiChanged(); return false; }
  try {
    const acc = await navigator.requestMIDIAccess({ sysex: false });
    IN.midi.access = acc;
    const hook = () => {
      const names = [];
      for (const inp of acc.inputs.values()) { inp.onmidimessage = onMidiMessage; names.push(inp.name || 'MIDI keyboard'); }
      IN.midi.names = names;
      IN.midi.status = names.length ? 'on' : 'none';
      midiChanged();
    };
    acc.onstatechange = hook;
    hook();
    return true;
  } catch (e) {
    IN.midi.status = 'denied';
    midiChanged();
    return false;
  }
}
function onMidiMessage(e) {
  const [st, d1, d2] = e.data;
  const cmd = st & 0xf0;
  if (cmd === 0x90 && d2 > 0) emitInput('on', d1, d2 / 127, 'midi');
  else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) emitInput('off', d1, 0, 'midi');
  else if (cmd === 0xb0 && d1 === 64) setSustain(d2 >= 64);
}

/* ---------- microphone: pitch detection for single notes; several notes at once (chords) with listen.js ---------- */
const MIC = { stream: null, src: null, an: null, timer: null, buf: null, fbuf: null, floor: 0.002, prev: 0, cand: null, active: null, onsetAt: 0, quiet: 0, pending: null, idle: 0, manual: false,
  chord: null, tune: 0, tx: 0, ty: 0 };
function micStart() {
  if (MIC.timer) return Promise.resolve(true);
  if (!MIC.pending) MIC.pending = micOpen().finally(() => { MIC.pending = null; });
  return MIC.pending;
}
async function micOpen() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { IN.mic.status = 'unsupported'; return false; }
  audioSessionType('play-and-record');
  try {
    MIC.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  } catch (e) {
    audioSessionType('playback');
    IN.mic.status = 'denied';
    return false;
  }
  const c = ac();
  if (!c) { MIC.stream.getTracks().forEach(t => t.stop()); MIC.stream = null; audioSessionType('playback'); IN.mic.status = 'unsupported'; return false; }
  if (c.state !== 'running') await c.resume().catch(() => {});
  MIC.src = c.createMediaStreamSource(MIC.stream);
  MIC.an = c.createAnalyser();
  MIC.an.fftSize = 8192;
  MIC.an.smoothingTimeConstant = 0;
  MIC.src.connect(MIC.an);
  MIC.buf = new Float32Array(MIC.an.fftSize);
  MIC.fbuf = new Float32Array(MIC.an.frequencyBinCount);
  MIC.timer = setInterval(micTick, 22);
  // iPhone ends the microphone when another app takes it; it starts again the next time Crescendo needs it.
  const stream = MIC.stream;
  stream.getAudioTracks().forEach(t => { t.onended = () => { if (MIC.stream === stream) micStop(); }; });
  IN.mic.on = true;
  IN.mic.status = 'on';
  return true;
}
function micStop() {
  clearInterval(MIC.timer);
  MIC.timer = null;
  if (MIC.active !== null) emitInput('off', MIC.active, 0, 'mic');
  MIC.active = null;
  if (MIC.stream) MIC.stream.getTracks().forEach(t => t.stop());
  if (MIC.src) MIC.src.disconnect();
  Object.assign(MIC, { stream: null, src: null, an: null });
  IN.mic.on = false;
  IN.mic.heard = null;
  IN.mic.chord = null;
  MIC.chord = null;
  MIC.manual = false;
  if (IN.mic.status === 'on') IN.mic.status = 'off';
  audioSessionType('playback');
}
// In microphone mode, listen while an exercise needs to hear you. Not while the app is in the background.
function ensureEars() {
  if (typeof S === 'undefined' || !S || S.prefs.input !== 'mic' || !IN.ears || IN.mic.on || MIC.pending || document.hidden) return;
  if (IN.mic.status === 'denied' || IN.mic.status === 'unsupported') return;
  micStart().then(ok => {
    if (!ok && typeof toast === 'function') toast(IN.mic.status === 'unsupported' ? 'This browser can’t use the microphone. Tap the keys on screen instead.' : 'Crescendo can’t use the microphone. Allow it for this site in your browser’s settings, or tap the keys on screen.');
  });
}
['pointerup', 'touchend', 'keydown'].forEach(t => document.addEventListener(t, ensureEars, { capture: true, passive: true }));
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (IN.mic.on) micStop(); } else ensureEars(); });
// YIN pitch estimate over the newest samples. Returns { f, conf } or null.
function yin(buf, sr, start, W = 1024) {
  const maxTau = Math.min(W, Math.floor(sr / 50)), minTau = Math.floor(sr / 2200);
  const d = new Float32Array(maxTau + 1);
  for (let tau = minTau; tau <= maxTau; tau++) {
    let s = 0;
    for (let i = 0; i < W; i++) { const x = buf[start + i] - buf[start + i + tau]; s += x * x; }
    d[tau] = s;
  }
  let run = 0, best = -1;
  const cm = new Float32Array(maxTau + 1);
  for (let tau = minTau; tau <= maxTau; tau++) { run += d[tau]; cm[tau] = run ? (d[tau] * (tau - minTau + 1)) / run : 1; }
  for (let tau = minTau + 1; tau < maxTau; tau++) {
    if (cm[tau] < 0.15) { while (tau + 1 < maxTau && cm[tau + 1] < cm[tau]) tau++; best = tau; break; }
  }
  if (best < 0) {
    let mn = 1;
    for (let tau = minTau + 1; tau < maxTau; tau++) if (cm[tau] < mn) { mn = cm[tau]; best = tau; }
    if (mn > 0.32) return null;
  }
  const a = cm[best - 1], b = cm[best], c = cm[best + 1];
  const shift = (a - c) / (2 * (a - 2 * b + c) || 1);
  return { f: sr / (best + (Math.abs(shift) < 1 ? shift : 0)), conf: 1 - b };
}
function micTick() {
  const an = MIC.an;
  if (!an) return;
  const sr = an.context.sampleRate, buf = MIC.buf, N = buf.length;
  an.getFloatTimeDomainData(buf);
  let s = 0;
  for (let i = N - 1024; i < N; i++) s += buf[i] * buf[i];
  const rms = Math.sqrt(s / 1024);
  MIC.floor = rms < MIC.floor ? MIC.floor * 0.7 + rms * 0.3 : MIC.floor * 0.995 + rms * 0.005;
  const sens = typeof S !== 'undefined' ? S.prefs.micSens || 1 : 1;
  const gate = Math.max(0.004, MIC.floor * 3) / sens;
  IN.mic.level = Math.min(1, rms * 8);
  const now = performance.now();
  // Ignore Crescendo's own piano (and the metronome's click pitches) so the phone doesn't hear itself.
  const self = AU.live.size > 0 || now < AU.selfUntil, clicking = clickSounding(now);
  if (!self && rms > gate && rms > MIC.prev * 1.35 && now - MIC.onsetAt > 110) { MIC.onsetAt = now; MIC.cand = null; chordStart(now); }
  MIC.prev = rms;
  if (self) { MIC.cand = null; MIC.chord = null; }
  else if (rms > gate) {
    MIC.quiet = 0;
    const r = yin(buf, sr, N - 2048);
    if (r && r.conf > 0.75 && r.f > 40 && r.f < 2400) {
      const mf = 69 + 12 * Math.log2(r.f / 440) - MIC.tune, m = Math.round(mf);
      const isClick = clicking && CLICK_HZ.some(f => Math.abs(m - (69 + 12 * Math.log2(f / 440))) < 0.6);
      if (Math.abs(mf - m) < 0.42 && !isClick) {
        IN.mic.heard = m;
        if (MIC.cand && MIC.cand.m === m) MIC.cand.n++; else MIC.cand = { m, n: 1 };
        const fresh = now - MIC.onsetAt < 260;
        if (MIC.cand.n >= 2 && (m !== MIC.active || (fresh && !MIC.cand.sent))) {
          if (MIC.active !== null) emitInput('off', MIC.active, 0, 'mic');
          MIC.active = m;
          MIC.cand.sent = true;
          emitInput('on', m, Math.min(1, rms * 6), 'mic');
        }
      }
    }
    if (MIC.chord && now >= MIC.chord.due[0] && !clicking) chordFrame(now);
  } else if (++MIC.quiet > 4) {
    if (MIC.active !== null) emitInput('off', MIC.active, 0, 'mic');
    MIC.active = null;
    IN.mic.heard = null;
    if (MIC.chord) chordEnd();
    if (IN.mic.chord) { IN.mic.chord = null; chordEmit(null); }
  }
}

/* Chords: after you play, look at the sound about every 60 ms for 0.7 s and gather the notes heard (listen.js). */
const CHORD_FRAMES = [90, 150, 210, 270, 330, 390, 450, 510, 570, 630];
function onChord(fn) { IN.chordSubs.add(fn); return () => IN.chordSubs.delete(fn); }
function chordStart(now) {
  if (!IN.chordSubs.size) return;
  // Notes rolled one after another (as beginners often do) build up one chord.
  if (MIC.chord && now - MIC.chord.onset < 300) { MIC.chord.due = CHORD_FRAMES.map(t => now + t); return; }
  MIC.chord = { onset: now, g: earGather(), due: CHORD_FRAMES.map(t => now + t) };
}
function chordFrame(now) {
  const ch = MIC.chord, an = MIC.an;
  while (ch.due.length && ch.due[0] <= now) ch.due.shift();
  an.getFloatFrequencyData(MIC.fbuf);
  const peaks = earPeaks(MIC.fbuf, an.context.sampleRate, an.fftSize);
  // Learn how far this piano sits from concert pitch, so an old or out-of-tune piano is still heard right.
  const t = earTune(peaks);
  MIC.tx = MIC.tx * 0.9 + t.w * Math.cos(2 * Math.PI * t.tune);
  MIC.ty = MIC.ty * 0.9 + t.w * Math.sin(2 * Math.PI * t.tune);
  if (Math.hypot(MIC.tx, MIC.ty) > 0) MIC.tune = Math.atan2(MIC.ty, MIC.tx) / (2 * Math.PI);
  ch.g.add(earNotes(peaks, { tune: MIC.tune }));
  chordReport(ch, now, !ch.due.length);
}
function chordReport(ch, now, final) {
  const heard = ch.g.heard();
  if (heard.length >= 2) IN.mic.chord = { ms: heard.map(e => e.low).sort((a, b) => a - b), at: now };
  else if (ch.g.frames >= 3) IN.mic.chord = null;
  chordEmit({ heard, has: pcs => ch.g.has(pcs), onset: ch.onset, final });
  if (final) MIC.chord = null;
}
// The sound died away before the last look: report what was heard.
function chordEnd() { const ch = MIC.chord; if (ch.g.frames) chordReport(ch, performance.now(), true); else MIC.chord = null; }
function chordEmit(e) { for (const f of [...IN.chordSubs]) { try { f(e); } catch (err) { console.error(err); } } }
// What "You're playing" shows: the keys held down, or the chord the microphone heard (note names only, as it can't
// always tell which octave). Returns { ms, mic }.
function playingNow() {
  const c = IN.mic.chord;
  if (c && performance.now() - c.at < 2500) return { ms: c.ms, mic: true };
  return { ms: [...IN.down].sort((a, b) => a - b), mic: false };
}
const playingName = (m, mic) => (mic ? noteLabel(spellCommon(m)) : noteFull(spell(m)));
