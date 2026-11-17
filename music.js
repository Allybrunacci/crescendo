/* Crescendo — music theory: pitches, intervals, scales, chords, keys, progressions and the music text format */
'use strict';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const ACC_SIGN = { '-2': '𝄫', '-1': '♭\uFE0E', 0: '', 1: '♯\uFE0E', 2: '𝄪' };
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const mod = (n, m) => ((n % m) + m) % m;

/* ---------- pitches ---------- */
// A spelled pitch: letter, alteration (-2..2) and octave. m is the MIDI number (60 = Middle C = C4).
function P(L, a, o) { return { L, a, o, m: (o + 1) * 12 + LETTER_PC[L] + a }; }
function parsePitch(s) {
  const r = /^([A-Ga-g])(##|bb|#|b|n|x)?(-?\d)$/.exec(String(s || '').trim());
  if (!r) return null;
  const a = { '#': 1, '##': 2, x: 2, b: -1, bb: -2, n: 0 }[r[2]] || 0;
  return P(r[1].toUpperCase(), a, +r[3]);
}
const pm = s => { const p = parsePitch(s); if (!p) throw new Error(`Bad pitch ${s}`); return p.m; };
function spell(m, flat) {
  const n = (flat ? FLAT_NAMES : SHARP_NAMES)[mod(m, 12)];
  return P(n[0], n.length > 1 ? (n[1] === '#' ? 1 : -1) : 0, Math.floor(m / 12) - 1);
}
const noteLabel = p => p.L + ACC_SIGN[p.a];
const noteFull = p => noteLabel(p) + p.o;
const pcLabel = (pc, flat) => { const n = (flat ? FLAT_NAMES : SHARP_NAMES)[mod(pc, 12)]; return n[0] + (n[1] === '#' ? '♯\uFE0E' : n[1] === 'b' ? '♭\uFE0E' : ''); };
// Text-style ♯ and ♭ (some systems otherwise draw them as colour emoji).
const textSym = s => String(s).replace(/([♯♭])(?!\uFE0E)/g, '$1\uFE0E');
const pretty = s => textSym(String(s).replace(/([A-G])#/g, '$1♯').replace(/([A-G])b/g, '$1♭'));
const freqOf = m => 440 * Math.pow(2, (m - 69) / 12);
const diat = p => p.o * 7 + LETTERS.indexOf(p.L);
const CLEF_MID = { treble: 34, bass: 22, rhythm: 34 };
const staffPos = (p, clef) => diat(p) - CLEF_MID[clef || 'treble'];
const isBlack = m => [1, 3, 6, 8, 10].includes(mod(m, 12));
// Up from p by an interval: num is the interval number (3 = a 3rd), semis its size in semitones.
function up(p, num, semis) {
  const li = LETTERS.indexOf(p.L) + (num - 1);
  const L = LETTERS[mod(li, 7)], o = p.o + Math.floor(li / 7);
  return P(L, p.m + semis - ((o + 1) * 12 + LETTER_PC[L]), o);
}

/* ---------- intervals ---------- */
const SEMI_NAMES = ['unison', 'minor 2nd', 'major 2nd', 'minor 3rd', 'major 3rd', 'perfect 4th', 'tritone', 'perfect 5th', 'minor 6th', 'major 6th', 'minor 7th', 'major 7th', 'octave'];
const NUM_WORDS = ['unison', '2nd', '3rd', '4th', '5th', '6th', '7th', 'octave'];
function intervalOf(a, b) {
  const lo = a.m <= b.m ? a : b, hi = lo === a ? b : a;
  const num = diat(hi) - diat(lo) + 1, semis = hi.m - lo.m;
  return { num, semis, name: semis <= 12 ? SEMI_NAMES[semis] : `${semis} semitones`, word: NUM_WORDS[num - 1] || `${num}th` };
}

/* ---------- scales ---------- */
const SCALES = {
  major: { name: 'major', st: [[1, 0], [2, 2], [3, 4], [4, 5], [5, 7], [6, 9], [7, 11], [8, 12]] },
  minor: { name: 'natural minor', st: [[1, 0], [2, 2], [3, 3], [4, 5], [5, 7], [6, 8], [7, 10], [8, 12]] },
  harmonic: { name: 'harmonic minor', st: [[1, 0], [2, 2], [3, 3], [4, 5], [5, 7], [6, 8], [7, 11], [8, 12]] },
  melodic: { name: 'melodic minor (going up)', st: [[1, 0], [2, 2], [3, 3], [4, 5], [5, 7], [6, 9], [7, 11], [8, 12]] },
  pentatonic: { name: 'major pentatonic', st: [[1, 0], [2, 2], [3, 4], [5, 7], [6, 9], [8, 12]] },
  minorpent: { name: 'minor pentatonic', st: [[1, 0], [3, 3], [4, 5], [5, 7], [7, 10], [8, 12]] },
  blues: { name: 'blues', st: [[1, 0], [3, 3], [4, 5], [4, 6], [5, 7], [7, 10], [8, 12]] },
  dorian: { name: 'Dorian mode', st: [[1, 0], [2, 2], [3, 3], [4, 5], [5, 7], [6, 9], [7, 10], [8, 12]] },
  mixolydian: { name: 'Mixolydian mode', st: [[1, 0], [2, 2], [3, 4], [4, 5], [5, 7], [6, 9], [7, 10], [8, 12]] },
};
function scaleNotes(tonic, type = 'major', octave = 4) {
  const t = parsePitch(tonic + octave);
  return SCALES[type].st.map(([n, s]) => up(t, n, s));
}
// Standard one-octave fingerings (right hand, left hand), going up.
const FINGERINGS = {
  'C major': ['12312345', '54321321'], 'G major': ['12312345', '54321321'], 'D major': ['12312345', '54321321'],
  'A major': ['12312345', '54321321'], 'E major': ['12312345', '54321321'], 'B major': ['12312345', '43214321'],
  'F major': ['12341234', '54321321'], 'Bb major': ['41231234', '32143213'], 'Eb major': ['31234123', '32143213'],
  'Ab major': ['34123123', '32143213'], 'Db major': ['23123412', '32143213'], 'F# major': ['23412312', '43213214'],
  'A minor': ['12312345', '54321321'], 'E minor': ['12312345', '54321321'], 'D minor': ['12312345', '54321321'],
  'G minor': ['12312345', '54321321'], 'C minor': ['12312345', '54321321'], 'B minor': ['12312345', '43214321'],
  'F minor': ['12341234', '54321321'],
};
function fingering(tonic, type) {
  const f = FINGERINGS[`${tonic} ${['minor', 'harmonic', 'melodic'].includes(type) ? 'minor' : type}`];
  return f ? { rh: f[0].split('').map(Number), lh: f[1].split('').map(Number) } : null;
}

/* ---------- keys ---------- */
const KEY_SIGS = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7,
  Am: 0, Em: 1, Bm: 2, 'F#m': 3, 'C#m': 4, 'G#m': 5, 'D#m': 6, Dm: -1, Gm: -2, Cm: -3, Fm: -4, Bbm: -5, Ebm: -6,
};
const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
function keyAcc(key) {
  const n = KEY_SIGS[key] || 0, acc = {};
  if (n > 0) SHARP_ORDER.slice(0, n).forEach(L => { acc[L] = 1; });
  if (n < 0) FLAT_ORDER.slice(0, -n).forEach(L => { acc[L] = -1; });
  return acc;
}
const isMinorKey = key => /m$/.test(key);
const keyTonic = key => key.replace(/m$/, '');
const keyName = key => `${pretty(keyTonic(key))} ${isMinorKey(key) ? 'minor' : 'major'}`;
function relativeKey(key) {
  const n = KEY_SIGS[key];
  return Object.keys(KEY_SIGS).find(k => KEY_SIGS[k] === n && isMinorKey(k) !== isMinorKey(key) && !/^(Cb|C#|G#m|D#m|Ebm|Bbm)$/.test(k)) || '';
}
const FIFTHS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const FIFTHS_MINOR = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'];

/* ---------- chords ---------- */
const CHORD_TYPES = {
  '': { name: 'major', st: [[1, 0], [3, 4], [5, 7]] },
  m: { name: 'minor', st: [[1, 0], [3, 3], [5, 7]] },
  dim: { name: 'diminished', st: [[1, 0], [3, 3], [5, 6]] },
  aug: { name: 'augmented', st: [[1, 0], [3, 4], [5, 8]] },
  sus2: { name: 'suspended 2nd', st: [[1, 0], [2, 2], [5, 7]] },
  sus4: { name: 'suspended 4th', st: [[1, 0], [4, 5], [5, 7]] },
  6: { name: 'major 6th', st: [[1, 0], [3, 4], [5, 7], [6, 9]] },
  m6: { name: 'minor 6th', st: [[1, 0], [3, 3], [5, 7], [6, 9]] },
  7: { name: 'dominant 7th', st: [[1, 0], [3, 4], [5, 7], [7, 10]] },
  maj7: { name: 'major 7th', st: [[1, 0], [3, 4], [5, 7], [7, 11]] },
  m7: { name: 'minor 7th', st: [[1, 0], [3, 3], [5, 7], [7, 10]] },
  m7b5: { name: 'half-diminished 7th', st: [[1, 0], [3, 3], [5, 6], [7, 10]] },
  dim7: { name: 'diminished 7th', st: [[1, 0], [3, 3], [5, 6], [7, 9]] },
  add9: { name: 'add 9', st: [[1, 0], [3, 4], [5, 7], [9, 14]] },
};
const CHORD_RE = /^([A-G])(#|b)?(maj7|m7b5|dim7|add9|sus2|sus4|dim|aug|m7|m6|7|6|m)?(?:\/([A-G])(#|b)?)?$/;
function parseChord(sym) {
  const r = CHORD_RE.exec(String(sym || '').trim());
  if (!r) return null;
  const acc = x => (x === '#' ? 1 : x === 'b' ? -1 : 0);
  return { root: { L: r[1], a: acc(r[2]) }, type: r[3] || '', bass: r[4] ? { L: r[4], a: acc(r[5]) } : null, sym };
}
// Spelled chord tones from the root at the given octave, optionally inverted (1 = 1st inversion…).
function chordPitches(sym, octave = 4, inv = 0) {
  const c = parseChord(sym);
  if (!c) return [];
  const root = P(c.root.L, c.root.a, octave);
  let ps = CHORD_TYPES[c.type].st.map(([n, s]) => up(root, n, s));
  for (let i = 0; i < inv % ps.length; i++) { const lo = ps.shift(); ps.push(P(lo.L, lo.a, lo.o + 1)); }
  if (c.bass) {
    let b = P(c.bass.L, c.bass.a, octave);
    while (b.m >= ps[0].m) b = P(b.L, b.a, b.o - 1);
    ps = ps.filter(p => mod(p.m, 12) !== mod(b.m, 12) || p.m - b.m > 12);
    ps.unshift(b);
  }
  return ps;
}
const chordPcs = sym => [...new Set(chordPitches(sym).map(p => mod(p.m, 12)))];
const chordLabel = sym => pretty(sym);
function chordName(sym) {
  const c = parseChord(sym);
  if (!c) return sym;
  return `${noteLabel(P(c.root.L, c.root.a, 4))} ${CHORD_TYPES[c.type].name}${c.bass ? ` over ${noteLabel(P(c.bass.L, c.bass.a, 4))}` : ''}`;
}
// Name the chord made by a set of notes (any order or octave). Returns symbols, best first.
const ID_ORDER = ['', 'm', '7', 'maj7', 'm7', 'dim', 'aug', 'sus4', 'sus2', 'm7b5', 'dim7', '6', 'm6'];
function identifyChord(ms) {
  const pcs = [...new Set(ms.map(m => mod(m, 12)))].sort((a, b) => a - b);
  if (pcs.length < 3) return [];
  const bass = mod(Math.min(...ms), 12), out = [];
  for (const type of ID_ORDER) {
    for (const r of pcs) {
      const want = CHORD_TYPES[type].st.map(([, s]) => mod(r + s, 12)).sort((a, b) => a - b);
      if (want.length !== pcs.length || want.some((v, i) => v !== pcs[i])) continue;
      // Eb, Ab and Bb are flats; Db for major-type chords, C# for minor-type ones.
      const flat = [3, 8, 10].includes(r) || (r === 1 && !/^m|dim/.test(type));
      const names = flat ? FLAT_NAMES : SHARP_NAMES;
      out.push(names[r] + type + (bass !== r ? `/${names[bass]}` : ''));
    }
  }
  return out;
}

/* ---------- roman numerals and progressions ---------- */
const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
// 'V7' in C → 'G7', 'ii' → 'Dm', 'vii°' → 'Bdim', 'bVII' → 'Bb'. Minor keys use the natural minor scale.
function romanChord(roman, key) {
  const r = /^(b|#)?(VII|VI|V|IV|III|II|I|vii|vi|v|iv|iii|ii|i)(°|ø|\+)?(maj7|7|sus4|sus2)?$/.exec(roman);
  if (!r) return '';
  const deg = ROMANS.indexOf(r[2].toUpperCase());
  const lower = r[2] === r[2].toLowerCase();
  const sc = scaleNotes(keyTonic(key), isMinorKey(key) ? 'minor' : 'major', 4);
  let root = sc[deg];
  if (r[1] === 'b') root = up(root, 1, -1);
  if (r[1] === '#') root = up(root, 1, 1);
  let type = lower ? 'm' : '';
  if (r[3] === '°') type = r[4] === '7' ? 'dim7' : 'dim';
  else if (r[3] === 'ø') type = 'm7b5';
  else if (r[3] === '+') type = 'aug';
  else if (r[4] === '7') type = lower ? 'm7' : '7';
  else if (r[4] === 'maj7') type = 'maj7';
  else if (r[4]) type = r[4];
  return root.L + (root.a > 0 ? '#' : root.a < 0 ? 'b' : '') + type;
}
const prettyRoman = r => r.replace(/^b/, '♭').replace(/^#/, '♯');
function diatonicChords(key) {
  const romans = isMinorKey(key) ? ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'] : ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
  return romans.map(roman => ({ roman, sym: romanChord(roman, key) }));
}
const PROGRESSIONS = [
  { id: 'classic', name: 'I–IV–V–I', nick: 'The classic', romans: ['I', 'IV', 'V', 'I'], key: 'C', about: 'Home, away, tension, home again. Folk songs, hymns and rock ’n’ roll are built on these three chords.' },
  { id: 'pop', name: 'I–V–vi–IV', nick: 'The pop progression', romans: ['I', 'V', 'vi', 'IV'], key: 'C', about: 'Probably the most-used progression in modern pop. Loop it and you’ll recognise it straight away.' },
  { id: 'fifties', name: 'I–vi–IV–V', nick: 'The ’50s progression', romans: ['I', 'vi', 'IV', 'V'], key: 'C', about: 'The doo-wop sound of the 1950s, and still everywhere in ballads.' },
  { id: 'heart', name: 'vi–IV–I–V', nick: 'The emotional one', romans: ['vi', 'IV', 'I', 'V'], key: 'C', about: 'The pop progression started on the minor chord. Same chords, moodier feel.' },
  { id: 'amen', name: 'I–IV–I', nick: 'The “Amen”', romans: ['I', 'IV', 'I', 'I'], key: 'C', about: 'A plagal cadence: the gentle “A-men” ending of hymns.' },
  { id: 'jazz', name: 'ii–V–I', nick: 'The jazz turnaround', romans: ['ii7', 'V7', 'Imaj7', 'Imaj7'], key: 'C', about: 'The building block of jazz. Each chord pulls to the next by a 5th.' },
  { id: 'canon', name: 'I–V–vi–iii–IV–I–IV–V', nick: 'Pachelbel’s Canon', romans: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'], key: 'C', about: 'From Pachelbel’s Canon (around 1700). The bass walks down while the chords glow.' },
  { id: 'epic', name: 'i–VI–III–VII', nick: 'The epic minor', romans: ['i', 'VI', 'III', 'VII'], key: 'Am', about: 'Film scores and anthems love this one. Dramatic, but hopeful.' },
  { id: 'andalusian', name: 'i–VII–VI–V', nick: 'Andalusian cadence', romans: ['i', 'VII', 'VI', 'V'], key: 'Am', about: 'A stepwise walk down with a Spanish flavour. The last chord is major (from harmonic minor).' },
  { id: 'blues', name: '12-bar blues', nick: 'The blues', romans: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'], key: 'C', about: 'Twelve bars that gave us blues, rock and roll and boogie-woogie.' },
];
// The Andalusian cadence ends on a major V (E, not Em) in A minor.
function progressionChords(prog, key) {
  const k = key || prog.key;
  return prog.romans.map((r, i) => (prog.id === 'andalusian' && i === 3 ? romanChord('V', keyTonic(k)).replace(/m$/, '') : romanChord(r, k)));
}
// Every voicing (inversion) of a chord whose notes all fall in [lo, hi].
function voicings(sym, lo = 55, hi = 79) {
  const out = [];
  for (let o = 2; o <= 5; o++) {
    const n = CHORD_TYPES[(parseChord(sym) || { type: '' }).type].st.length;
    for (let inv = 0; inv < n; inv++) {
      const ps = chordPitches(sym.replace(/\/.*/, ''), o, inv);
      if (ps.length && ps[0].m >= lo && ps[ps.length - 1].m <= hi) out.push({ inv, ps });
    }
  }
  return out;
}
// Smooth right-hand voicings: each chord moves as little as possible from the last.
function voiceLead(syms, around = 64, lo = 55, hi = 79) {
  const res = [];
  let prev = null;
  for (const sym of syms) {
    const opts = voicings(sym, lo, hi);
    if (!opts.length) { res.push({ inv: 0, ps: chordPitches(sym, 4) }); continue; }
    let best = null, bestCost = Infinity;
    for (const v of opts) {
      const ms = v.ps.map(p => p.m);
      let cost;
      if (!prev) cost = Math.abs(ms.reduce((a, b) => a + b, 0) / ms.length - around) + v.inv * 0.5;
      else {
        const pm2 = prev.ps.map(p => p.m);
        cost = 0;
        for (let i = 0; i < Math.max(ms.length, pm2.length); i++) cost += Math.abs((ms[Math.min(i, ms.length - 1)]) - pm2[Math.min(i, pm2.length - 1)]);
        cost += v.inv * 0.1;
      }
      if (cost < bestCost) { bestCost = cost; best = v; }
    }
    res.push(best);
    prev = best;
  }
  return res;
}

/* ---------- time ---------- */
const DUR = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };
function parseTime(ts) {
  const [num, den] = String(ts || '4/4').split('/').map(Number);
  const barLen = (num * 4) / den;
  const compound = den === 8 && num % 3 === 0 && num > 3;
  const beat = compound ? 1.5 : 4 / den;
  return { num, den, barLen, beat, beats: Math.round(barLen / beat), group: den === 8 ? 1.5 : 1, compound };
}
function durBase(d) {
  for (const [b, v] of Object.entries(DUR)) {
    if (Math.abs(v - d) < 1e-6) return { base: b, dots: 0 };
    if (Math.abs(v * 1.5 - d) < 1e-6) return { base: b, dots: 1 };
  }
  return null;
}

/* ---------- the music text format ----------
   Tokens, separated by spaces:
     C4q  D#4e  Bb3h.  [C4,E4,G4]w  rq  xq (a rhythm-only hit)   — pitch + duration (w h q e s) + optional dot
     ~ after a note ties it to the next one; @3 (or @1,3,5 for a chord) adds finger numbers; * staccato; > accent
     | bar line   "Am" chord symbol for the next note   !p !mf !f … dynamics   !cresc !dim   ( and ) a slur      */
const NOTE_RE = /^(\[([^\]]+)\]|r|x|[A-Ga-g](?:##|bb|#|b|n|x)?-?\d)([whqes])(\.?)(~?)(?:@([\d,]+))?([*>]?)$/;
function parseMusic(text, opt = {}) {
  const time = parseTime(opt.time || '4/4');
  const pickup = opt.pickup || 0;
  const events = [], bars = [], errors = [];
  let t = 0, barStart = 0, chord = null, dyn = null, slurOpen = false, pendingSlurEnd = false;
  const closeBar = final => {
    const len = t - barStart;
    if (len <= 1e-9 && final) return;
    const idx = bars.length;
    const want = idx === 0 && pickup ? pickup : final && pickup ? time.barLen - pickup : time.barLen;
    if (!opt.loose && Math.abs(len - want) > 1e-6) errors.push(`Bar ${idx + 1} has ${len} beats, expected ${want}`);
    bars.push({ start: barStart, len });
    barStart = t;
  };
  const tokens = String(text || '').trim().split(/\s+/).filter(Boolean);
  tokens.forEach((tok, ti) => {
    if (tok === '|') { closeBar(false); return; }
    if (tok === '(') { slurOpen = true; return; }
    if (tok === ')') { pendingSlurEnd = true; if (events.length) events[events.length - 1].slurEnd = true; return; }
    if (/^".*"$/.test(tok)) { chord = tok.slice(1, -1); return; }
    if (tok[0] === '!') { dyn = tok.slice(1); return; }
    const r = NOTE_RE.exec(tok);
    if (!r) { errors.push(`Can't read “${tok}” (token ${ti + 1})`); return; }
    const d = DUR[r[3]] * (r[4] ? 1.5 : 1);
    const ev = { i: events.length, t, d, base: r[3], dots: r[4] ? 1 : 0, rest: r[1] === 'r', ps: [], fing: null, tie: !!r[5], bar: bars.length };
    if (r[1] === 'x') { ev.ps = [P('B', 0, 4)]; ev.hit = true; } else if (!ev.rest) {
      const names = r[2] ? r[2].split(',') : [r[1]];
      ev.ps = names.map(n => parsePitch(n));
      if (ev.ps.some(p => !p)) { errors.push(`Bad pitch in “${tok}”`); ev.ps = ev.ps.filter(Boolean); }
      ev.ps.sort((a, b) => a.m - b.m || diat(a) - diat(b));
    }
    if (r[6]) {
      const f = r[6].split(',').map(Number);
      ev.fing = names2fing(f, ev.ps.length);
    }
    if (r[7] === '*') ev.art = 'stacc';
    if (r[7] === '>') ev.art = 'accent';
    if (chord) { ev.chord = chord; chord = null; }
    if (dyn) { ev.dyn = dyn; dyn = null; }
    if (slurOpen) { ev.slurStart = true; slurOpen = false; }
    events.push(ev);
    t += d;
  });
  closeBar(true);
  // Mark the notes that continue a tie, so they aren't played again.
  for (let i = 1; i < events.length; i++) if (events[i - 1].tie && !events[i].rest) events[i].tied = true;
  return { events, bars, len: t, time, pickup, errors };
}
function names2fing(f, n) {
  if (f.length >= n) return f.slice(0, n);
  return f.concat(Array(n - f.length).fill(null));
}
const eventMidis = ev => (ev.rest ? [] : ev.ps.map(p => p.m));

// A piece: one or two staves that line up bar for bar.
function parsePiece(spec) {
  const o = { time: spec.time || '4/4', pickup: spec.pickup || 0 };
  const staves = [];
  if (spec.rh) staves.push({ hand: 'R', clef: spec.rhClef || 'treble', ...parseMusic(spec.rh, o) });
  if (spec.lh) staves.push({ hand: 'L', clef: spec.lhClef || 'bass', ...parseMusic(spec.lh, o) });
  if (spec.music) staves.push({ hand: spec.hand || 'R', clef: spec.clef || 'treble', ...parseMusic(spec.music, o) });
  const errors = [].concat(...staves.map(s => s.errors));
  if (staves.length === 2) {
    if (staves[0].bars.length !== staves[1].bars.length) errors.push(`Hands have ${staves[0].bars.length} and ${staves[1].bars.length} bars`);
    if (Math.abs(staves[0].len - staves[1].len) > 1e-6) errors.push(`Hands last ${staves[0].len} and ${staves[1].len} beats`);
  }
  return { staves, key: spec.key || 'C', time: o.time, pickup: o.pickup, tempo: spec.tempo || 80, errors, len: staves.length ? staves[0].len : 0, bars: staves.length ? staves[0].bars : [] };
}

// Moments where notes start, across both hands: what to play next in “wait for me” mode.
function pieceSteps(piece, hands = 'RL', fromBar = 0, toBar = Infinity) {
  const byT = new Map();
  piece.staves.forEach((st, s) => {
    if (!hands.includes(st.hand)) return;
    for (const ev of st.events) {
      if (ev.rest || ev.tied || ev.bar < fromBar || ev.bar > toBar) continue;
      const k = Math.round(ev.t * 1e4);
      if (!byT.has(k)) byT.set(k, { t: ev.t, notes: [], evs: [] });
      const step = byT.get(k);
      step.notes.push(...eventMidis(ev));
      step.evs.push([s, ev.i]);
    }
  });
  return [...byT.values()].sort((a, b) => a.t - b.t).map(s => ({ ...s, notes: [...new Set(s.notes)].sort((a, b) => a - b) }));
}

// Seconds-per-beat from a tempo in beats per minute (the beat being the time signature's beat).
const secPerQ = (bpm, time) => 60 / bpm / (time ? time.beat : 1);
