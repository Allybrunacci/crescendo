/* Crescendo — hearing several notes at once in the microphone's sound. Pure maths with no browser APIs, so it can be tested anywhere.
   A piano note is a stack of harmonics (f, 2f, 3f…, slightly stretched). Each possible note is scored by the peaks sitting on its
   harmonics; the best is taken, its harmonics are mostly removed (leaving a share where another note may use the same peak),
   and the search repeats. Over the moments after you play, the notes heard are gathered into a chord. */
'use strict';

// Settings tuned on synthetic piano chords "recorded" by a phone in a room (work/chordlab.js).
const EAR = { lo: 36, hi: 96, harmonics: 14, fMax: 5000, stop: 0.15, maxNotes: 6, ghost: 0.2, ghostH: 0.45, pruneW: 'flat', extra: 0.35, extraN: 0.5 };

// Peaks in a spectrum given in dB (like an AnalyserNode's getFloatFrequencyData): [{ f, a }] in rising frequency,
// where a is the peak's strength above the background around it.
function earPeaks(db, sr, fftSize, fMax = EAR.fMax) {
  const n = db.length, bin = sr / fftSize, k1 = Math.min(n - 2, Math.floor(fMax / bin));
  const cs = new Float64Array(n + 1);
  for (let k = 0; k < n; k++) cs[k + 1] = cs[k] + (db[k] > -160 ? db[k] : -160);
  let top = -Infinity;
  for (let k = 2; k <= k1; k++) if (db[k] > top) top = db[k];
  const out = [];
  for (let k = 3; k <= k1; k++) {
    const y1 = db[k];
    if (y1 < db[k - 1] || y1 <= db[k + 1] || y1 < top - 48) continue;
    // Background: the average level over about a third of an octave either side.
    const w = Math.max(4, Math.round(k * 0.25)), lo = Math.max(0, k - w), hi = Math.min(n, k + w + 1);
    const bg = (cs[hi] - cs[lo]) / (hi - lo);
    if (y1 - bg < 8) continue;
    const y0 = db[k - 1], y2 = db[k + 1], den = y0 - 2 * y1 + y2;
    const d = den < 0 ? Math.max(-0.5, Math.min(0.5, (0.5 * (y0 - y2)) / den)) : 0;
    out.push({ f: (k + d) * bin, a: Math.pow(10, y1 / 20) - Math.pow(10, bg / 20) });
  }
  return out;
}

// Piano strings are stiff, so upper harmonics run a little sharp; more so in the treble.
const earStretch = m => 0.00015 * Math.pow(2, (m - 36) / 18);

// How far the instrument sits from concert pitch, in semitones (−0.5…0.5), from where the strong lower peaks fall.
// Returns { tune, w } where w says how much sound it was based on.
function earTune(peaks) {
  let x = 0, y = 0, w = 0;
  for (const p of peaks) {
    if (p.f < 60 || p.f > 1200) continue;
    const ang = 2 * Math.PI * 12 * Math.log2(p.f / 440);
    x += p.a * Math.cos(ang); y += p.a * Math.sin(ang); w += p.a;
  }
  return { tune: w ? Math.atan2(y, x) / (2 * Math.PI) : 0, w: w ? Math.hypot(x, y) : 0 };
}

function earNearest(P, f, tol) {
  let lo = 0, hi = P.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (P[mid].f < f) lo = mid + 1; else hi = mid; }
  let best = -1, bd = tol;
  for (let i = Math.max(0, lo - 1); i <= Math.min(P.length - 1, lo + 1); i++) {
    const d = Math.abs(P[i].f - f);
    if (d <= bd && P[i].a > 0) { bd = d; best = i; }
  }
  return best;
}

// How well the peaks support note m (tune = how far the instrument sits from concert pitch, in semitones).
function earSupport(P, m, tune, H) {
  const f0 = 440 * Math.pow(2, (m + tune - 69) / 12), B = earStretch(m), idx = [];
  let s = 0;
  for (let h = 1; h <= H; h++) {
    const fh = h * f0 * Math.sqrt(1 + B * h * h);
    if (fh > EAR.fMax) { idx.push(-1); continue; }
    const i = earNearest(P, fh, fh * (Math.pow(2, (30 + 4 * h) / 1200) - 1));
    idx.push(i);
    if (i >= 0) s += (P[i].a * (f0 + 27)) / (h * f0 + 320);
  }
  return { s, idx };
}

// The notes in one moment of sound, strongest first: [{ m, s }] with s relative to the strongest (1).
function earNotes(peaks, opts = {}) {
  const lo = opts.lo || EAR.lo, hi = opts.hi || EAR.hi, H = opts.harmonics || EAR.harmonics, tune = opts.tune || 0;
  const stop = opts.stop === undefined ? EAR.stop : opts.stop, maxN = opts.maxNotes || EAR.maxNotes;
  const P = peaks.map(p => ({ f: p.f, a: p.a }));
  const found = [], taken = new Set();
  let first = 0;
  for (let it = 0; it < maxN && P.length; it++) {
    let best = null;
    for (let m = lo; m <= hi; m++) {
      if (taken.has(m)) continue;
      const r = earSupport(P, m, tune, H);
      if (!best || r.s > best.s) best = { m, s: r.s, idx: r.idx };
    }
    if (!best || best.s <= 0) break;
    if (!first) first = best.s;
    else if (best.s < first * stop) break;
    found.push(best);
    taken.add(best.m);
    // Take away this note's share of each harmonic: no more than the smooth run of its neighbours, so a peak
    // that's bigger because another note shares it keeps the difference.
    const A = best.idx.map(i => (i >= 0 ? P[i].a : 0));
    best.idx.forEach((i, h) => {
      if (i < 0) return;
      const near = [A[h - 1], A[h], A[h + 1]].filter(x => x !== undefined && x > 0);
      const smooth = near.reduce((x, y) => x + y, 0) / near.length;
      P[i].a -= Math.min(P[i].a, (h === 0 ? A[0] : smooth) * 0.92);
    });
  }
  const kept = earPrune(peaks, found, tune, H);
  const top = kept.length ? Math.max(...kept.map(n => n.s)) : 1;
  return kept.map(n => ({ m: n.m, s: n.s / top })).sort((a, b) => b.s - a.s);
}

// A note's nth harmonic frequency.
function earHarm(m, tune, h) { const f0 = 440 * Math.pow(2, (m + tune - 69) / 12); return h * f0 * Math.sqrt(1 + earStretch(m) * h * h); }
// Drops "ghost" notes: the overtones of a lower note posing as notes, like the G and E inside a single low C.
// Where a note's harmonic shares a peak with a lower note's harmonic, the lower note is given what its neighbouring
// harmonics (ones nobody else shares) suggest, and the higher note only keeps what's left over. A real G above a low C
// is much louder than the C's 3rd harmonic would be, so it keeps plenty; an overtone posing as a note keeps little.
function earPrune(peaks, found, tune, H) {
  if (found.length < 2) return found.map(n => ({ m: n.m, s: n.s }));
  const A = peaks.map(p => p.a);
  const info = found.map(n => ({ m: n.m, idx: earSupport(peaks, n.m, tune, H).idx }));
  const owners = new Map();
  info.forEach((n, j) => n.idx.forEach((i, h) => { if (i >= 0) { if (!owners.has(i)) owners.set(i, []); owners.get(i).push(j); } }));
  const env = (j, h) => {
    const n = info[j], vals = [];
    for (const k of [h - 1, h + 1, h - 2, h + 2]) {
      const i = n.idx[k];
      if (i === undefined || i < 0 || owners.get(i).length > 1) continue;
      vals.push(A[i]);
      if (vals.length === 2) break;
    }
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : A[n.idx[h]];
  };
  const own = info.map((n, j) => {
    const f0 = earHarm(n.m, tune, 1);
    return n.idx.reduce((s, i, h) => {
      if (i < 0) return s;
      let x = A[i];
      info.forEach((o, k) => { if (k !== j && o.m < n.m) { const hk = o.idx.indexOf(i); if (hk >= 0) x -= env(k, hk); } });
      const w = EAR.pruneW === 'flat' ? 1 : EAR.pruneW === 'sqrt' ? 1 / Math.sqrt(h + 1) : (f0 + 27) / ((h + 1) * f0 + 320);
      return s + Math.max(0, x) * w;
    }, 0);
  });
  const top = Math.max(...own);
  // A note sitting exactly on a lower note's overtone (an octave and a fifth up, two octaves and a third…) needs more to count.
  const onOvertone = n => info.some(o => o.m < n.m && [19, 28, 31, 34, 38, 40].includes(n.m - o.m));
  return found.map((n, j) => ({ m: n.m, s: own[j] })).filter(n => n.s >= top * (onOvertone(n) ? EAR.ghostH : EAR.ghost));
}

// Gathers the notes heard over the moments after you play, so a chord counts once it has settled.
function earGather() {
  let pcs = new Map(), frames = 0;
  const g = {
    reset() { pcs = new Map(); frames = 0; },
    add(notes) {
      frames++;
      for (const n of notes) {
        const pc = ((n.m % 12) + 12) % 12, e = pcs.get(pc) || { pc, n: 0, best: 0, m: n.m, low: n.m };
        e.n++;
        if (n.s > e.best) { e.best = n.s; e.m = n.m; }
        e.low = Math.min(e.low, n.m);
        pcs.set(pc, e);
      }
    },
    get frames() { return frames; },
    // Note names (0–11) heard firmly: in two or more moments, or very strongly once.
    heard(minS = 0.25) { return [...pcs.values()].filter(e => (e.n >= 2 && e.best >= minS) || e.best >= 0.6).sort((a, b) => b.best - a.best); },
    // Every note of the chord heard, and nothing else heard firmly and often. Needs two looks or more.
    has(want, minS = 0.18) {
      if (frames < 2) return false;
      const ok = want.every(pc => { const e = pcs.get(pc); return e && (e.n >= 2 ? e.best >= minS : e.best >= 0.5); });
      if (!ok) return false;
      return ![...pcs.values()].some(e => !want.includes(e.pc) && e.best >= EAR.extra && e.n >= Math.max(2, frames * EAR.extraN));
    },
  };
  return g;
}
