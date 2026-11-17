/* Crescendo — where notes come from: on-screen keys, the computer keyboard, a MIDI piano, or the microphone */
'use strict';

const IN = { subs: new Set(), chromaSubs: new Set(), down: new Set(), keyBase: 60, midi: { status: 'off', names: [], access: null }, mic: { on: false, level: 0, heard: null, status: 'off' } };

function onInput(fn) { IN.subs.add(fn); return () => IN.subs.delete(fn); }
function onChroma(fn) { IN.chromaSubs.add(fn); return () => IN.chromaSubs.delete(fn); }
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

/* ---------- microphone: pitch detection for single notes, a chroma “fingerprint” for chords ---------- */
const MIC = { stream: null, src: null, an: null, timer: null, buf: null, fbuf: null, floor: 0.002, prev: 0, cand: null, active: null, onsetAt: 0, quiet: 0, chromaDue: 0 };
async function micStart() {
  if (MIC.timer) return true;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { IN.mic.status = 'unsupported'; return false; }
  try {
    MIC.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  } catch (e) {
    IN.mic.status = 'denied';
    return false;
  }
  const c = ac();
  if (c.state !== 'running') await c.resume().catch(() => {});
  MIC.src = c.createMediaStreamSource(MIC.stream);
  MIC.an = c.createAnalyser();
  MIC.an.fftSize = 8192;
  MIC.an.smoothingTimeConstant = 0;
  MIC.src.connect(MIC.an);
  MIC.buf = new Float32Array(MIC.an.fftSize);
  MIC.fbuf = new Float32Array(MIC.an.frequencyBinCount);
  MIC.timer = setInterval(micTick, 22);
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
  IN.mic.status = 'off';
}
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
  if (rms > gate && rms > MIC.prev * 1.35 && now - MIC.onsetAt > 110) { MIC.onsetAt = now; MIC.cand = null; MIC.chromaDue = now + 90; }
  MIC.prev = rms;
  if (rms > gate) {
    MIC.quiet = 0;
    const r = yin(buf, sr, N - 2048);
    if (r && r.conf > 0.75 && r.f > 40 && r.f < 2400) {
      const mf = 69 + 12 * Math.log2(r.f / 440), m = Math.round(mf);
      if (Math.abs(mf - m) < 0.42) {
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
    if (MIC.chromaDue && now >= MIC.chromaDue && IN.chromaSubs.size) { MIC.chromaDue = 0; emitChroma(); }
  } else if (++MIC.quiet > 4 && MIC.active !== null) {
    emitInput('off', MIC.active, 0, 'mic');
    MIC.active = null;
    IN.mic.heard = null;
  }
}
// How strongly each of the 12 note names sounds right now (0–1).
function micChroma() {
  const an = MIC.an;
  if (!an) return null;
  an.getFloatFrequencyData(MIC.fbuf);
  const sr = an.context.sampleRate, binHz = sr / an.fftSize, v = new Float32Array(12);
  for (let k = Math.ceil(60 / binHz); k < Math.min(MIC.fbuf.length, 2200 / binHz); k++) {
    const f = k * binHz, mf = 69 + 12 * Math.log2(f / 440), m = Math.round(mf);
    if (Math.abs(mf - m) > 0.3) continue;
    const mag = Math.pow(10, MIC.fbuf[k] / 20);
    v[mod(m, 12)] += mag / (1 + f / 700);
  }
  const mx = Math.max(...v);
  if (!(mx > 0)) return null;
  return Array.from(v, x => x / mx);
}
function emitChroma() {
  const v = micChroma();
  if (!v) return;
  for (const f of [...IN.chromaSubs]) { try { f(v); } catch (e) { console.error(e); } }
}
// True if the chroma looks like these pitch classes are all sounding.
function chromaHas(v, pcs) {
  if (!v) return false;
  const tot = v.reduce((a, b) => a + b, 0);
  const inSet = pcs.reduce((a, pc) => a + v[pc], 0);
  return pcs.every(pc => v[pc] >= 0.3) && inSet / tot >= 0.55;
}
