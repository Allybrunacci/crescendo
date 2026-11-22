/* Crescendo — theory drills for practice away from the piano: musical terms, scales and chords on paper, keys and the
   circle of fifths, roman numerals, hearing rhythms, completing a bar and naming intervals. All multiple choice. */
'use strict';

// Musical words and signs: [name, meaning, level (the unit it belongs to), category]. Words that mean the same thing
// share exactly the same meaning text, so they're never offered as two different answers.
const MUSIC_TERMS = [
  ['Largo', 'Very slow and broad', 1, 'tempo'], ['Adagio', 'Slowly', 1, 'tempo'], ['Andante', 'At a walking pace', 1, 'tempo'],
  ['Moderato', 'At a moderate speed', 1, 'tempo'], ['Allegro', 'Fast and lively', 1, 'tempo'], ['Presto', 'Very fast', 1, 'tempo'],
  ['Tempo', 'The speed of the beat', 1, 'tempo'], ['bpm', 'Beats per minute', 1, 'tempo'],
  ['Bar line', 'A line that divides the music into {bars}', 2, 'signs'], ['Double bar line', 'Marks the end of a section', 2, 'signs'],
  ['Final bar line', 'Marks the end of the piece', 2, 'signs'], ['Time signature', 'How many beats in a {bar}, and what kind', 2, 'signs'],
  ['Clef', 'Fixes which note sits on which line', 2, 'signs'], ['Ledger line', 'A short extra line above or below the staff', 2, 'signs'],
  ['Piano (p)', 'Soft', 3, 'dynamics'], ['Forte (f)', 'Loud', 3, 'dynamics'], ['Mezzo piano (mp)', 'Moderately soft', 3, 'dynamics'],
  ['Mezzo forte (mf)', 'Moderately loud', 3, 'dynamics'], ['Pianissimo (pp)', 'Very soft', 3, 'dynamics'], ['Fortissimo (ff)', 'Very loud', 3, 'dynamics'],
  ['Crescendo (cresc.)', 'Gradually getting louder', 3, 'dynamics'], ['Diminuendo (dim.)', 'Gradually getting softer', 3, 'dynamics'],
  ['Decrescendo (decresc.)', 'Gradually getting softer', 3, 'dynamics'],
  ['Legato', 'Smooth and connected', 3, 'articulation'], ['Staccato', 'Short and detached', 3, 'articulation'], ['Accent (>)', 'Play the note with extra weight', 3, 'articulation'],
  ['Slur', 'A curved line over different notes: play them smoothly', 3, 'articulation'], ['Tie', 'A curved line joining two of the same note: hold for both', 3, 'articulation'],
  ['Fermata', 'A pause: hold the note longer', 3, 'articulation'], ['Tenuto', 'Hold the note for its full length', 3, 'articulation'],
  ['Repeat sign', 'Play the section again', 3, 'signs'], ['First-time {bar}', 'Play it the first time through only', 3, 'signs'],
  ['Ritardando (rit.)', 'Gradually slowing down', 3, 'tempo'], ['Rallentando (rall.)', 'Gradually slowing down', 3, 'tempo'],
  ['A tempo', 'Back to the original speed', 3, 'tempo'], ['Accelerando (accel.)', 'Gradually getting faster', 3, 'tempo'],
  ['Dolce', 'Sweetly', 5, 'expression'], ['Cantabile', 'In a singing style', 5, 'expression'], ['Espressivo', 'With expression', 5, 'expression'],
  ['Con brio', 'With spirit', 5, 'expression'], ['Maestoso', 'Majestically', 5, 'expression'], ['Grazioso', 'Gracefully', 5, 'expression'],
  ['Leggiero', 'Lightly', 5, 'expression'], ['Tranquillo', 'Calmly', 5, 'expression'], ['Poco', 'A little', 5, 'expression'],
  ['Molto', 'Very, or much', 5, 'expression'], ['Più', 'More', 5, 'expression'], ['Meno', 'Less', 5, 'expression'],
  ['Sempre', 'Always', 5, 'expression'], ['Poco a poco', 'Little by little', 5, 'expression'], ['Subito', 'Suddenly', 5, 'expression'],
  ['Allegretto', 'Fairly fast (a little slower than allegro)', 7, 'tempo'], ['Lento', 'Slow', 7, 'tempo'], ['Vivace', 'Lively and quick', 7, 'tempo'],
  ['Rubato', 'With flexible timing, for expression', 7, 'tempo'],
  ['Sforzando (sfz)', 'A sudden, strong accent', 7, 'dynamics'], ['Fortepiano (fp)', 'Loud, then soft straight away', 7, 'dynamics'],
  ['Staccatissimo', 'Very short and detached', 7, 'articulation'], ['Marcato', 'Strongly accented', 7, 'articulation'],
  ['Da capo (D.C.)', 'Go back to the beginning', 7, 'signs'], ['Dal segno (D.S.)', 'Go back to the sign', 7, 'signs'],
  ['Fine', 'The end (after a D.C. or D.S.)', 7, 'signs'], ['Coda', 'The ending section', 7, 'signs'],
  ['8va', 'Play an octave higher', 7, 'signs'], ['Ped.', 'Press the sustain pedal', 7, 'signs'], ['Simile', 'Carry on in the same way', 7, 'signs'],
];
const aOrAn = w => (/^[aeiou]/i.test(w) ? 'an' : 'a');
const nl = p => noteLabel(p);
const ACC_WORD = n => (n === 0 ? 'No sharps or flats' : plural(Math.abs(n), n > 0 ? 'sharp' : 'flat'));
const keyAccList = key => { const n = KEY_SIGS[key] || 0; return n > 0 ? SHARP_ORDER.slice(0, n).map(L => `${L}♯`) : n < 0 ? FLAT_ORDER.slice(0, -n).map(L => `${L}♭`) : []; };
const accListText = key => { const a = keyAccList(key); return a.length ? textSym(joinAnd(a)) : 'None'; };
const joinAnd = a => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const scaleOf = key => scaleNotes(keyTonic(key), isMinorKey(key) ? 'minor' : 'major', 4);
// The same letter with a different accidental, chosen to look like a real mistake (F instead of F♯, E♭ instead of E).
function altOf(p, key) {
  if (p.a !== 0) return P(p.L, 0, 4);
  if (p.L === 'E' || p.L === 'B') return P(p.L, -1, 4);
  if (p.L === 'F' || p.L === 'C') return P(p.L, 1, 4);
  return P(p.L, (KEY_SIGS[key] || 0) < 0 ? -1 : 1, 4);
}
const DEGREE_NAMES = ['tonic', 'supertonic', 'mediant', 'subdominant', 'dominant', 'submediant', 'leading note'];
const ORD = n => ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'][n] || `${n}th`;
// Has the learner finished this theory study? (theory studies are in away.js)
const studied = id => !!(S.theory && S.theory[id] && S.theory[id].done);

// A multiple-choice question: options (HTML), the right index, and what to say.
function mcq(api, { q, html = '', opts, ans, key, why, grid }) {
  unlockChoices(api);
  api.mark(ans);
  api.sh.q.innerHTML = `${html}<p class="prompt">${q}</p>`;
  api.sh.a.innerHTML = choiceButtons(opts, grid === false ? '' : opts.length > 3 || grid ? 'grid2' : '');
  const t0 = performance.now();
  onChoice(api, i => {
    const ok = i === ans;
    markChoice(api, i, ok, ans);
    api.answer(ok, key, performance.now() - t0, ok ? (why ? `${icon('check')} ${why}` : null) : `${icon('x')} ${why || `It’s <b>${opts[ans]}</b>.`}`);
  });
}
// Puts the right answer among distinct distractors, in a random order.
function optionsWith(r, right, others, n = 4) {
  const seen = new Set([right]), pool = [];
  for (const o of shuffle(r, others)) if (!seen.has(o)) { seen.add(o); pool.push(o); }
  const opts = shuffle(r, [right, ...pool.slice(0, n - 1)]);
  return { opts, ans: opts.indexOf(right) };
}

Object.assign(DRILLS, {
  /* ---- Musical words and signs ---- */
  terms: {
    title: 'Musical terms',
    count: 8,
    run(api) {
      const lv = api.spec.level || 8, cat = api.spec.cat;
      let pool = MUSIC_TERMS.filter(t => t[2] <= lv && (!cat || t[3] === cat));
      if (pool.length < 4) pool = MUSIC_TERMS.filter(t => t[2] <= Math.max(lv, 3) && (!cat || t[3] === cat));
      if (pool.length < 4) pool = MUSIC_TERMS.filter(t => t[2] <= Math.max(lv, 3));
      let last = null;
      return {
        ask() {
          const w = t => { const a = statAcc(`tm:${t[0]}`); return (a === null ? 1.2 : 1.6 - a) + (t === last ? -10 : 0); };
          const t = weighted(api.r, pool, x => Math.max(0.05, w(x)));
          last = t;
          const same = MUSIC_TERMS.filter(x => x[1] === t[1]).map(x => x[0]);
          const near = pool.filter(x => x[1] !== t[1] && x[3] === t[3]), far = pool.filter(x => x[1] !== t[1] && x[3] !== t[3]);
          const others = shuffle(api.r, near).concat(shuffle(api.r, far));
          if (api.r() < 0.55) {
            const { opts, ans } = optionsWith(api.r, T(t[1]), [...new Set(others.map(x => T(x[1])))]);
            mcq(api, { q: `What does <b>${esc(T(t[0]))}</b> mean?`, opts: opts.map(esc), ans, key: `tm:${t[0]}`, why: `<b>${esc(T(t[0]))}</b>: ${esc(T(t[1]).toLowerCase())}.`, grid: false });
          } else {
            const names = others.filter(x => !same.includes(x[0])).map(x => T(x[0]));
            const { opts, ans } = optionsWith(api.r, T(t[0]), [...new Set(names)]);
            mcq(api, { q: `Which one means <i>${esc(T(t[1]).toLowerCase())}</i>?`, opts: opts.map(esc), ans, key: `tm:${t[0]}`, why: `<b>${esc(T(t[0]))}</b> means ${esc(T(t[1]).toLowerCase())}.` });
          }
        },
      };
    },
  },

  /* ---- Scales on paper ---- */
  scalespell: {
    title: 'Scales on paper',
    count: 8,
    run(api) {
      const keys = (api.spec.keys || ['C', 'G', 'F']).filter(k => KEY_SIGS[k] !== undefined);
      const names = api.spec.names || studied('th-degrees');
      const kinds = ['degree', 'degree', 'acc', 'notin'].concat(names ? ['name', 'name'] : [], keys.some(k => !isMinorKey(k)) ? ['pattern'] : []);
      return {
        ask() {
          const kind = pick(api.r, kinds);
          const key = pick(api.r, kind === 'pattern' ? keys.filter(k => !isMinorKey(k)) : keys), sc = scaleOf(key), kn = keyName(key);
          if (kind === 'degree') {
            const n = 2 + Math.floor(api.r() * 6), p = sc[n - 1], right = nl(p);
            const others = [nl(altOf(p, key)), nl(sc[n - 2]), nl(sc[n]), nl(P(p.L, p.a === 0 ? -1 : -p.a, 4))];
            const { opts, ans } = optionsWith(api.r, right, others);
            mcq(api, { q: `What’s the <b>${ORD(n)}</b> note of <b>${kn}</b>?`, opts, ans, key: `ss:${key}`, why: `${kn}: ${sc.slice(0, 7).map(nl).join(' ')}. Note ${n} is <b>${right}</b>.` });
          } else if (kind === 'acc') {
            const right = accListText(key);
            const others = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb', 'Ab'].filter(k => KEY_SIGS[k] !== KEY_SIGS[key]).map(accListText);
            const { opts, ans } = optionsWith(api.r, right, others);
            mcq(api, { q: `Which sharps or flats are in <b>${kn}</b>?`, opts, ans, key: `ss:acc:${key}`, why: `${kn} has ${ACC_WORD(KEY_SIGS[key]).toLowerCase()}${keyAccList(key).length ? `: ${accListText(key)}` : ''}.` });
          } else if (kind === 'notin') {
            const deg = 1 + Math.floor(api.r() * 6), p = sc[deg];
            const wrong = altOf(p, key);
            const ins = shuffle(api.r, sc.slice(0, 7).filter((x, i) => i !== deg)).slice(0, 3).map(nl);
            const opts = shuffle(api.r, [nl(wrong), ...ins]);
            mcq(api, { q: `Which note is <b>not</b> in <b>${kn}</b>?`, opts, ans: opts.indexOf(nl(wrong)), key: `ss:notin:${key}`, why: `${kn} uses <b>${nl(p)}</b>, not ${nl(wrong)}: ${sc.slice(0, 7).map(nl).join(' ')}.` });
          } else if (kind === 'name') {
            const n = 1 + Math.floor(api.r() * 7), right = cap(DEGREE_NAMES[n - 1]);
            const { opts, ans } = optionsWith(api.r, right, DEGREE_NAMES.map(cap));
            mcq(api, { q: `In <b>${kn}</b>, note ${n} is <b>${nl(sc[n - 1])}</b>. What’s that degree called?`, opts, ans, key: `ss:name:${n}`, why: `Note ${n} of any scale is the <b>${DEGREE_NAMES[n - 1]}</b>.` });
          } else {
            const right = 'Notes 3–4 and 7–8';
            const { opts, ans } = optionsWith(api.r, right, ['Notes 2–3 and 6–7', 'Notes 4–5 and 7–8', 'Notes 1–2 and 5–6', 'Notes 3–4 and 6–7']);
            mcq(api, { q: T('In a major scale, where are the two {semis}?'), opts, ans, key: 'ss:pattern', why: T('{Tone} {tone} {semi} {tone} {tone} {tone} {semi}: the {semis} come between notes 3–4 and 7–8.') });
          }
        },
      };
    },
  },

  /* ---- Chords on paper ---- */
  chordspell: {
    title: 'Chords on paper',
    count: 8,
    run(api) {
      const pool = (api.spec.chords || ['C', 'F', 'G', 'Am', 'Dm', 'Em']).filter(c => parseChord(c));
      const spellOf = sym => chordPitches(sym, 4).map(nl).join(' – ');
      const rootOf = sym => sym.replace(/^([A-G][#b]?).*$/, '$1');
      const variants = sym => { const r = rootOf(sym); return ['', 'm', 'dim', 'aug', '7'].map(t => r + t).filter(x => x !== sym && parseChord(x)); };
      return {
        ask() {
          const sym = pick(api.r, pool), kind = pick(api.r, ['notes', 'notes', 'name', 'tone']);
          if (kind === 'notes') {
            const { opts, ans } = optionsWith(api.r, spellOf(sym), [...variants(sym), ...pool.filter(x => x !== sym)].map(spellOf));
            mcq(api, { q: `Which notes make <b>${pretty(sym)}</b>?`, opts, ans, key: `cs:${sym}`, why: `<b>${pretty(sym)}</b> (${chordName(sym)}) is ${spellOf(sym)}.`, grid: false });
            setTimeout(() => { if (!api.stopped()) playChord(chordPitches(sym, 4).map(p => p.m), 1.2, 0, 0.55); }, 0);
          } else if (kind === 'name') {
            const { opts, ans } = optionsWith(api.r, pretty(sym), [...variants(sym), ...pool.filter(x => x !== sym)].map(pretty));
            mcq(api, { q: `Which chord is <b>${spellOf(sym)}</b>?`, opts, ans, key: `cs:${sym}`, why: `${spellOf(sym)} is <b>${pretty(sym)}</b> (${chordName(sym)}).` });
          } else {
            const ps = chordPitches(sym, 4), j = api.r() < 0.5 ? 1 : 2, right = nl(ps[j]);
            const others = [nl(ps[0]), nl(ps[3 - j] || ps[0]), nl(P(ps[j].L, ps[j].a === 0 ? (api.r() < 0.5 ? 1 : -1) : 0, 4)), nl(up(ps[j], 2, 2))];
            const { opts, ans } = optionsWith(api.r, right, others);
            mcq(api, { q: `What’s the <b>${j === 1 ? '3rd' : '5th'}</b> of <b>${pretty(sym)}</b>?`, opts, ans, key: `cs:${sym}`, why: `${pretty(sym)} is ${spellOf(sym)}: the ${j === 1 ? '3rd' : '5th'} is <b>${right}</b>.` });
          }
        },
      };
    },
  },

  /* ---- Keys and the circle of fifths ---- */
  keyfind: {
    title: 'Keys and key signatures',
    count: 8,
    run(api) {
      const keys = (api.spec.keys || ['C', 'G', 'D', 'F', 'Bb']).filter(k => KEY_SIGS[k] !== undefined && !isMinorKey(k));
      const minor = api.spec.minor || hasSkill('scale-Am') || studied('th-minor');
      const circle = api.spec.circle || hasSkill('circle') || studied('th-circle');
      const majors = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'];
      const kinds = ['count', 'count', 'which', 'which'].concat(minor ? ['rel', 'rel'] : [], circle ? ['circle'] : []);
      return {
        ask() {
          let kind = pick(api.r, kinds), key = pick(api.r, keys);
          if (kind === 'rel' && !relativeKey(key)) key = pick(api.r, keys.filter(k => relativeKey(k)).concat(['C']));
          const n = KEY_SIGS[key];
          if (kind === 'count') {
            const right = ACC_WORD(n);
            const { opts, ans } = optionsWith(api.r, right, [ACC_WORD(-n || 1), ACC_WORD(n + 1), ACC_WORD(n - 1), ACC_WORD(n + (n >= 0 ? 2 : -2))].filter(x => x !== right));
            mcq(api, { q: `How many sharps or flats does <b>${keyName(key)}</b> have?`, opts, ans, key: `kf:${key}`, why: `${keyName(key)}: ${ACC_WORD(n).toLowerCase()}${n ? ` (${accListText(key)})` : ''}.` });
          } else if (kind === 'which') {
            const { opts, ans } = optionsWith(api.r, `${pretty(key)} major`, majors.filter(k => k !== key && Math.abs(KEY_SIGS[k] - n) <= 2).concat(majors.filter(k => KEY_SIGS[k] === -n && k !== key)).map(k => `${pretty(k)} major`));
            mcq(api, { q: `Which major key has <b>${ACC_WORD(n).toLowerCase()}</b>?`, opts, ans, key: `kf:${key}`, why: `<b>${keyName(key)}</b> has ${ACC_WORD(n).toLowerCase()}${n ? `: ${accListText(key)}` : ''}.` });
          } else if (kind === 'rel') {
            const rel = relativeKey(key), right = keyName(rel);
            const par = `${keyTonic(key)}m`, others = [keyName(par), ...['Am', 'Em', 'Bm', 'Dm', 'Gm', 'Cm', 'F#m'].filter(k => k !== rel).map(keyName)];
            const { opts, ans } = optionsWith(api.r, right, KEY_SIGS[par] !== undefined ? others : others.slice(1));
            mcq(api, { q: `What’s the relative minor of <b>${keyName(key)}</b>?`, opts, ans, key: `kf:rel:${key}`, why: T(`<b>${right}</b> shares ${keyName(key)}’s key signature. It starts on note 6 of the major scale, 3 {semis} below ${pretty(key)}.`) });
          } else {
            const i = FIFTHS.indexOf(key) >= 0 ? FIFTHS.indexOf(key) : 0, nxt = FIFTHS[(i + 1) % 12], prv = FIFTHS[(i + 11) % 12];
            const { opts, ans } = optionsWith(api.r, `${pretty(nxt)} major`, [prv, FIFTHS[(i + 2) % 12], FIFTHS[(i + 6) % 12]].map(k => `${pretty(k)} major`));
            mcq(api, { q: `On the circle of fifths, which key comes after <b>${keyName(FIFTHS[i])}</b>, going clockwise?`, opts, ans, key: `kf:circle:${FIFTHS[i]}`, why: `Clockwise goes up a 5th each step, adding a sharp (or taking away a flat): ${pretty(FIFTHS[i])} → <b>${pretty(nxt)}</b>.` });
          }
        },
      };
    },
  },

  /* ---- Roman numerals ---- */
  roman: {
    title: 'Roman numerals',
    count: 8,
    run(api) {
      const keys = (api.spec.keys || ['C', 'G', 'F']).filter(k => KEY_SIGS[k] !== undefined && !isMinorKey(k));
      const sev = api.spec.sevenths || hasSkill('sevenths');
      return {
        ask() {
          const key = pick(api.r, keys), dc = diatonicChords(key), kind = pick(api.r, ['chord', 'chord', 'numeral', 'numeral', 'minor'].concat(sev ? ['v7'] : []));
          if (kind === 'chord') {
            const c = pick(api.r, dc), { opts, ans } = optionsWith(api.r, pretty(c.sym), dc.filter(x => x !== c).map(x => pretty(x.sym)));
            mcq(api, { q: `In <b>${pretty(key)} major</b>, which chord is <b>${c.roman}</b>?`, opts, ans, key: `rn:${key}:${c.roman}`, why: `${pretty(key)} major: ${dc.map(x => `${x.roman} ${pretty(x.sym)}`).join(', ')}.` });
          } else if (kind === 'numeral') {
            const c = pick(api.r, dc), { opts, ans } = optionsWith(api.r, c.roman, dc.filter(x => x !== c).map(x => x.roman));
            mcq(api, { q: `In <b>${pretty(key)} major</b>, <b>${pretty(c.sym)}</b> is which numeral?`, opts, ans, key: `rn:${key}:${c.roman}`, why: `${pretty(c.sym)} is built on note ${ROMANS.indexOf(c.roman.replace(/°/, '').toUpperCase()) + 1} of ${pretty(key)} major, so it’s <b>${c.roman}</b>.` });
          } else if (kind === 'minor') {
            const { opts, ans } = optionsWith(api.r, 'ii, iii and vi', ['I, IV and V', 'ii, IV and vi', 'iii, V and vii°']);
            mcq(api, { q: 'In any major key, which chords are <b>minor</b>?', opts, ans, key: 'rn:minor', why: 'Lowercase numerals are minor: <b>ii, iii and vi</b>. I, IV and V are major, and vii° is diminished.' });
          } else {
            const right = romanChord('V7', key), { opts, ans } = optionsWith(api.r, pretty(right), [romanChord('IV7', key), romanChord('I7', key), romanChord('ii7', key), romanChord('Imaj7', key)].map(pretty));
            mcq(api, { q: `In <b>${pretty(key)} major</b>, which chord is <b>V7</b>?`, opts, ans, key: `rn:${key}:V7`, why: `V7 is the dominant 7th on note 5: <b>${pretty(right)}</b> = ${chordPitches(right, 4).map(nl).join(' – ')}.` });
          }
        },
      };
    },
  },

  /* ---- Hear a rhythm, pick the notation ---- */
  rhythmhear: {
    title: 'Which rhythm do you hear?',
    count: 6,
    run(api) {
      const lv = api.spec.level || 1, time = api.spec.time || '4/4', tm = parseTime(time), tempo = api.spec.tempo || 76, spb = 60 / tempo;
      const onsets = text => parseMusic(text, { time, loose: true }).events.filter(e => !e.rest && !e.tied).map(e => e.t).join(',');
      let cur = null;
      const play = () => {
        if (!cur) return;
        hush();
        const t0 = audioNow() + 0.15, beatSec = spb * tm.beat;
        for (let k = 0; k < tm.beats; k++) click(t0 + k * beatSec, k === 0 ? 0 : 1);
        const start = t0 + tm.beats * beatSec;
        cur.events.forEach(ev => { if (!ev.rest && !ev.tied) playNote(72, Math.max(0.1, ev.d * spb * 0.85), start + ev.t * spb, 0.55); });
      };
      return {
        ask() {
          unlockChoices(api);
          const right = makeRhythm(api.r, lv, time, 1).text, seen = new Set([onsets(right)]), opts = [right];
          for (let g = 0; g < 60 && opts.length < 3; g++) { const t = makeRhythm(api.r, lv, time, 1).text, o = onsets(t); if (!seen.has(o)) { seen.add(o); opts.push(t); } }
          const order = shuffle(api.r, opts.map((_, i) => i)), ans = order.indexOf(0);
          cur = parsePiece({ clef: 'rhythm', music: right, time }).staves[0];
          api.mark(ans);
          api.sh.q.innerHTML = `<button type="button" class="listen-btn" aria-label="Play again">${icon('ear')}</button><p class="prompt">Listen to the count-in, then the rhythm. Which one is it?</p>`;
          $('.listen-btn', api.sh.q).onclick = play;
          api.sh.a.innerHTML = `<div class="choices rh-opts">${order.map((k, i) => `<button type="button" class="choice" data-c="${i}" aria-label="Rhythm ${'ABC'[i]}"><span class="opt-l">${'ABC'[i]}</span><span class="rh-mini"></span></button>`).join('')}</div>`;
          const w = Math.max(200, Math.min(320, (api.sh.a.clientWidth || 300) - 70));
          $$('.rh-mini', api.sh.a).forEach((el, i) => drawPiece(el, parsePiece({ clef: 'rhythm', music: opts[order[i]], time }), { width: w, scale: 6.6, fill: true, label: `Rhythm ${'ABC'[i]}` }));
          setTimeout(() => { if (!api.stopped()) play(); }, 350);
          onChoice(api, i => {
            const ok = i === ans;
            markChoice(api, i, ok, ans);
            api.answer(ok, `rhh:${lv}`, 0, ok ? `${icon('check')} That’s the one.` : `${icon('x')} It was <b>${'ABC'[ans]}</b>. Tap ${icon('ear')} to hear it again.`);
          });
        },
        stop() { hush(); },
      };
    },
  },

  /* ---- Which note completes the bar? ---- */
  barmath: {
    title: 'Complete the bar',
    count: 6,
    run(api) {
      const lv = api.spec.level || 1, time = api.spec.time || '4/4', tm = parseTime(time);
      const VAL = { q: 1, h: 2, 'h.': 3, e: 0.5, 'q.': 1.5, w: 4 };
      const NAME = { q: 'q', h: 'h', 'h.': 'dh', e: 'e', 'q.': 'dq', w: 'w' };
      const missing = (tm.compound ? ['e', 'q', 'q.'] : ['q', 'h'].concat(lv >= 2 ? ['h.'] : [], lv >= 3 ? ['e'] : [], lv >= 4 ? ['q.'] : [])).filter(v => VAL[v] < tm.barLen - 1e-9);
      const cells = [['xq', 1], ['xh', 2]].concat(lv >= 2 ? [['rq', 1], ['xh.', 3]] : [], lv >= 3 || tm.compound ? [['xe', 0.5], ['xe xe', 1]] : [], lv >= 4 || tm.compound ? [['xq.', 1.5]] : []);
      const fill = len => {
        // Compound time: a full dotted-{q} beat, then the start of the second beat, so the beat groups stay clear.
        if (tm.compound) return [pick(api.r, ['xq.', 'xq xe', 'xe xe xe'])].concat(len > 1.5 + 1e-9 ? [len - 1.5 > 0.75 ? 'xq' : 'xe'] : []).join(' ');
        for (let g = 0; g < 200; g++) {
          let left = len, out = [];
          while (left > 1e-9) { const fit = cells.filter(c => c[1] <= left + 1e-9); if (!fit.length) break; const c = pick(api.r, fit); out.push(c[0]); left -= c[1]; }
          if (left < 1e-9 && out.some(t => t[0] === 'x')) return out.join(' ');
        }
        return Array(Math.round(len)).fill('xq').join(' ');
      };
      return {
        ask() {
          unlockChoices(api);
          const v = pick(api.r, missing), music = `${fill(tm.barLen - VAL[v])} x${v}`;
          const piece = parsePiece({ clef: 'rhythm', music, time }), last = piece.staves[0].events.length - 1;
          const candidates = Object.keys(NAME).filter(k => k !== v && (!tm.compound || k !== 'w') && VAL[k] <= tm.barLen);
          const label = k => cap(term(NAME[k]));
          const { opts, ans } = optionsWith(api.r, label(v), candidates.map(label));
          api.mark(ans);
          api.sh.q.innerHTML = `<div class="bm-wrap"><div class="bm-score"></div><span class="bm-q" aria-hidden="true">?</span></div><p class="prompt">${T(`Which note completes this {bar} of ${time}?`)}</p>`;
          const w = Math.min(340, api.sh.q.clientWidth || 320);
          const sc = drawPiece($('.bm-score', api.sh.q), piece, { width: w, scale: notationScale(w), label: `An unfinished ${term('bar')}` });
          const g = sc.el(0, last), wrap = $('.bm-wrap', api.sh.q), qm = $('.bm-q', api.sh.q);
          if (g && wrap) {
            g.classList.add('ghost');
            requestAnimationFrame(() => { const a = g.getBoundingClientRect(), b = wrap.getBoundingClientRect(); if (a.width) { qm.style.left = `${a.left - b.left + a.width / 2}px`; qm.style.top = `${a.top - b.top + a.height / 2}px`; } });
          }
          api.sh.a.innerHTML = choiceButtons(opts.map(esc), 'grid2');
          onChoice(api, i => {
            const ok = i === ans;
            markChoice(api, i, ok, ans);
            if (g) g.classList.remove('ghost');
            if (qm) qm.hidden = true;
            const have = tm.barLen - VAL[v], beatsWord = x => (x === 1 ? '1 beat' : `${String(x).replace('0.5', '½').replace('.5', '½')} beats`);
            api.answer(ok, `bm:${v}`, 0, `${ok ? icon('check') : icon('x')} ${T(`The {bar} needs ${tm.barLen} {q} beats and has ${beatsWord(have)}, so it’s missing ${beatsWord(VAL[v])}: ${aOrAn(term(NAME[v]))} <b>${term(NAME[v])}</b>.`)}`);
          });
        },
      };
    },
  },

  /* ---- Name the interval (with its quality) ---- */
  ivqual: {
    title: 'Name the interval',
    count: 8,
    run(api) {
      const IV = { m2: ['minor 2nd', 2, 1], M2: ['major 2nd', 2, 2], m3: ['minor 3rd', 3, 3], M3: ['major 3rd', 3, 4], P4: ['perfect 4th', 4, 5], P5: ['perfect 5th', 5, 7], m6: ['minor 6th', 6, 8], M6: ['major 6th', 6, 9], m7: ['minor 7th', 7, 10], M7: ['major 7th', 7, 11], P8: ['octave', 8, 12] };
      const set = (api.spec.set || ['M2', 'm3', 'M3', 'P4', 'P5']).filter(k => IV[k]);
      return {
        ask() {
          const code = pick(api.r, set), [name, num, semis] = IV[code];
          let lo = null, hi = null;
          for (let g = 0; g < 40; g++) { const L = pick(api.r, ['C', 'D', 'E', 'F', 'G', 'A']), a = P(L, 0, 4), b = up(a, num, semis); if (Math.abs(b.a) <= 1) { lo = a; hi = b; break; } }
          if (!lo) { lo = P('C', 0, 4); hi = up(lo, num, semis); }
          const harmonic = api.r() < 0.3;
          const pc = parsePiece({ music: harmonic ? `[${tokOf(lo)},${tokOf(hi)}]w` : `${tokOf(lo)}h ${tokOf(hi)}h`, time: '4/4' });
          const pool = set.filter(k => k !== code), near = pool.filter(k => IV[k][1] === num), rest = pool.filter(k => IV[k][1] !== num);
          const { opts, ans } = optionsWith(api.r, cap(name), [...shuffle(api.r, near), ...shuffle(api.r, rest)].map(k => cap(IV[k][0])), Math.min(4, set.length));
          mcq(api, { q: `<b>${nl(lo)}</b> up to <b>${nl(hi)}</b> is a…`, html: '<div class="card-note wide"></div>', opts, ans, key: `iq:${code}`, why: T(`${nl(lo)} to ${nl(hi)} spans ${num === 8 ? 'eight letters' : `${num} letters`} and ${plural(semis, '{semi}', '{semis}')}: ${aOrAn(name)} <b>${name}</b>.`) });
          drawPiece($('.card-note', api.sh.q), pc, { width: 220, scale: 10, label: 'Two notes' });
          if (harmonic) playChord([lo.m, hi.m], 1.2); else playSeq([lo.m, hi.m], 0.6, 0.55);
        },
      };
    },
  },
});
