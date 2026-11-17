/* Crescendo — drills: short, adaptive exercises that feed your daily practice */
'use strict';

const LETTER_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// A hand seen from above, palm down, with numbered fingers. side 'R' or 'L'; hi = finger to highlight.
function handArt(side = 'R', hi = 0, opts = {}) {
  const F = [
    { n: 1, d: 'M44 118c-9-4-25-18-31-30-4-7 2-13 8-10 9 5 18 16 30 22', cx: 17, cy: 80 },
    { n: 2, d: 'M50 92V34c0-6 4-10 9-10s9 4 9 10v58', cx: 59, cy: 32 },
    { n: 3, d: 'M70 92V22c0-6 4-10 9-10s9 4 9 10v70', cx: 79, cy: 20 },
    { n: 4, d: 'M90 92V30c0-6 4-10 9-10s9 4 9 10v62', cx: 99, cy: 28 },
    { n: 5, d: 'M110 96V48c0-5 4-9 8-9s8 4 8 9v52', cx: 118, cy: 46 },
  ];
  const palm = 'M44 92h84c6 0 8 6 7 12l-6 40c-1 8-7 12-14 12H58c-8 0-13-5-15-12l-9-26c-2-6 2-11 10-11z';
  const fingers = F.map(f => `<g class="fg${f.n === hi ? ' hi' : ''}" data-f="${f.n}"><path d="${f.d}" class="fgp"/>${opts.numbers === false ? '' : `<circle cx="${f.cx}" cy="${f.cy}" r="8.5" class="fgc"/><text x="${f.cx}" y="${f.cy}" class="fgt">${f.n}</text>`}</g>`).join('');
  const flip = side === 'L' ? 'transform="translate(150 0) scale(-1 1)"' : '';
  const nums = side === 'L' ? fingers.replace(/<text x="([\d.]+)" y="([\d.]+)" class="fgt">(\d)<\/text>/g, (m, x, y, n) => `<text x="${x}" y="${y}" class="fgt" transform="translate(${2 * x} 0) scale(-1 1)">${n}</text>`) : fingers;
  return `<svg class="hand" viewBox="0 0 150 166" role="img" aria-label="${side === 'L' ? 'Left' : 'Right'} hand"><g ${flip}><path d="${palm}" class="palm"/>${nums}</g><text x="75" y="160" class="hand-l">${side === 'L' ? 'Left hand' : 'Right hand'}</text></svg>`;
}

function drillShell(host, title, opts = {}) {
  host.innerHTML = `<div class="drill">
    <div class="dr-top"><span class="dr-title">${esc(title)}</span><span class="dr-prog"></span></div>
    <div class="dr-q"></div><div class="dr-a"></div><div class="dr-fb" role="status"></div><div class="dr-kb"></div><div class="dr-foot"></div></div>`;
  const el = host.firstElementChild;
  return { el, q: $('.dr-q', el), a: $('.dr-a', el), fb: $('.dr-fb', el), kbEl: $('.dr-kb', el), foot: $('.dr-foot', el), prog: $('.dr-prog', el) };
}

// Runs a drill. spec.k picks the kind. onDone({ right, total, score, secs }) when a round ends.
function runDrill(host, spec, onDone) {
  const make = DRILLS[spec.k];
  if (!make) { host.innerHTML = `<p class="muted">This exercise isn’t available.</p>`; return { stop() {} }; }
  const sh = drillShell(host, spec.title || make.title, spec);
  const r = rng(spec.seed || Date.now());
  const n = spec.count || make.count || 10;
  const res = { right: 0, total: 0, t0: performance.now(), streak: 0, best: 0 };
  let ctrl = null, stopped = false, kb = null, unsub = null;
  const cleanups = [];
  const api = {
    r, spec, sh, res,
    kb(opts = {}) {
      if (!kb) kb = createKeyboard(sh.kbEl, { from: opts.from || 48, to: opts.to || 72, labels: opts.labels || 'c', ...opts });
      else if (opts.from) kb.setRange(opts.from, opts.to);
      return kb;
    },
    input(fn) { if (unsub) unsub(); unsub = onInput(ev => { if (!stopped) fn(ev); }); },
    chroma(fn) { const u = onChroma(v => { if (!stopped) fn(v); }); cleanups.push(u); },
    prog() { sh.prog.innerHTML = `<span class="pips">${Array.from({ length: n }, (_, i) => `<i class="${i < res.total ? 'done' : ''}${i === res.total ? ' cur' : ''}"></i>`).join('')}</span>`; },
    // Record an answer; then the next question (or the end) after a moment.
    answer(ok, key, ms, msg) {
      res.total++;
      if (ok) { res.right++; res.streak++; res.best = Math.max(res.best, res.streak); } else res.streak = 0;
      if (key) stat(key, ok, ms);
      sh.fb.className = 'dr-fb ' + (ok ? 'ok' : 'bad');
      sh.fb.innerHTML = msg || (ok ? `${icon('check')} ${pick(r, ['Yes!', 'Correct!', 'Nice!', 'That’s it!', 'Spot on!'])}${res.streak >= 3 ? ` · ${res.streak} in a row` : ''}` : `${icon('x')} Not quite.`);
      api.prog();
      if (ok) buzz(8); else buzz(30);
      later(() => (res.total >= n ? finish() : next()), ok ? 650 : 1500);
    },
    later,
    stopped: () => stopped,
    // The right answer, for automated tests.
    mark(v) { sh.el.dataset.ans = String(v); },
  };
  const timers = [];
  function later(fn, ms) { const id = setTimeout(() => { if (!stopped) fn(); }, ms); timers.push(id); }
  function next() {
    sh.fb.className = 'dr-fb';
    sh.fb.innerHTML = '';
    api.prog();
    ctrl.ask(res.total);
  }
  function finish() {
    const secs = (performance.now() - res.t0) / 1000;
    const score = res.total ? res.right / res.total : 0;
    if (unsub) { unsub(); unsub = null; }
    if (kb) kb.clear();
    if (ctrl.end) ctrl.end();
    const pct = Math.round(score * 100);
    sh.q.innerHTML = `<div class="dr-end"><div class="big">${pct}%</div><p>${res.right} of ${res.total} right${res.best >= 3 ? ` · best run ${res.best}` : ''} · ${Math.round(secs)} s</p>
      <p class="muted">${pct >= 90 ? 'Excellent. This one’s sticking!' : pct >= 70 ? 'Good work. A few more goes and it’ll be automatic.' : 'Keep at it. Little and often is how this gets easy.'}</p></div>`;
    sh.a.innerHTML = '';
    sh.fb.innerHTML = '';
    sh.foot.innerHTML = `<button type="button" class="btn ghost" data-dr="again">${icon('redo')} Again</button>${spec.doneLabel !== false ? `<button type="button" class="btn primary" data-dr="done">${spec.doneLabel || 'Done'}</button>` : ''}`;
    if (pct >= 90) confetti(14);
    if (spec.skill) skillResult(spec.skill, score);
    save();
    if (onDone) onDone({ right: res.right, total: res.total, score, secs, final: false });
  }
  sh.el.addEventListener('click', e => {
    const b = e.target.closest('[data-dr]');
    if (!b) return;
    if (b.dataset.dr === 'again') { Object.assign(res, { right: 0, total: 0, t0: performance.now(), streak: 0, best: 0 }); sh.foot.innerHTML = ''; if (ctrl.start) ctrl.start(); next(); }
    if (b.dataset.dr === 'done' && spec.onExit) spec.onExit();
  });
  ctrl = make.run(api);
  if (ctrl.start) ctrl.start();
  next();
  return {
    stop() { stopped = true; timers.forEach(clearTimeout); if (unsub) unsub(); cleanups.forEach(f => f()); if (ctrl && ctrl.stop) ctrl.stop(); if (kb) kb.destroy(); hush(); },
    result: res,
  };
}
const choiceButtons = (opts, cls = '') => `<div class="choices ${cls}">${opts.map((o, i) => `<button type="button" class="choice" data-c="${i}">${o}</button>`).join('')}</div>`;
function onChoice(api, fn) {
  api.sh.a.onclick = e => {
    const b = e.target.closest('[data-c]');
    if (!b || api.sh.a.dataset.locked) return;
    api.sh.a.dataset.locked = '1';
    fn(+b.dataset.c, b);
  };
}
const unlockChoices = api => { delete api.sh.a.dataset.locked; };
const markChoice = (api, i, ok, right) => {
  const bs = $$('.choice', api.sh.a);
  if (bs[i]) bs[i].classList.add(ok ? 'ok' : 'bad');
  if (!ok && right !== undefined && bs[right]) bs[right].classList.add('ok');
};

const DRILLS = {
  /* ---- Name the note on the staff ---- */
  read: {
    title: 'Note reading',
    run(api) {
      const sp = api.spec;
      const pool = [];
      for (const [clef, lo, hi] of sp.ranges || [['treble', 60, 67]]) for (let m = pm(lo); m <= pm(hi); m++) if (!isBlack(m) || sp.acc) pool.push({ clef, m });
      const playMode = sp.answer === 'keys';
      let cur = null, t0 = 0, last = null;
      if (playMode) {
        const ms = pool.map(p => p.m);
        api.kb({ from: Math.min(...ms) - 2, to: Math.max(...ms) + 2, labels: 'c' });
      }
      return {
        ask() {
          unlockChoices(api);
          const w = it => { const a = statAcc(`nt:${it.clef}:${it.m}`); return (a === null ? 1.2 : 1.6 - a) + (last && it.m === last.m && it.clef === last.clef ? -10 : 0); };
          cur = weighted(api.r, pool, it => Math.max(0.05, w(it)));
          last = cur;
          const p = spell(cur.m, sp.flats && api.r() < 0.5);
          cur.p = p;
          api.mark(playMode ? cur.m : p.L + p.a);
          api.sh.q.innerHTML = '<div class="card-note"></div>';
          noteCard($('.card-note', api.sh.q), { clef: cur.clef, pitch: p, scale: 11, width: 190, label: 'Which note is this?' });
          t0 = performance.now();
          if (playMode) {
            api.sh.a.innerHTML = `<p class="prompt">${INPUT_HINT()}</p>`;
            api.input(ev => {
              if (ev.type !== 'on' || !cur) return;
              const ok = ev.m === cur.m || (ev.src === 'mic' && mod(ev.m - cur.m, 12) === 0);
              const c = cur; cur = null;
              api.kb().flash(ev.m, ok ? 'ok' : 'bad', 600);
              if (!ok) api.kb().flash(c.m, 'target', 1400);
              api.answer(ok, `nt:${c.clef}:${c.m}`, performance.now() - t0, ok ? null : `${icon('x')} That was ${noteLabel(spell(ev.m))}. This note is <b>${noteLabel(c.p)}</b>.`);
            });
          } else {
            const accs = sp.acc ? ['♮', '♯', '♭'] : null;
            api.sh.a.innerHTML = choiceButtons(LETTER_KEYS, 'letters') + (accs ? `<div class="acc-row seg sm">${accs.map((a, i) => `<button type="button" data-acc="${[0, 1, -1][i]}" class="${i === 0 ? 'on' : ''}">${a}</button>`).join('')}</div>` : '');
            let accSel = 0;
            api.sh.a.querySelectorAll('[data-acc]').forEach(b => b.addEventListener('click', () => { accSel = +b.dataset.acc; api.sh.a.querySelectorAll('[data-acc]').forEach(x => x.classList.toggle('on', x === b)); }));
            onChoice(api, i => {
              const ok = LETTER_KEYS[i] === cur.p.L && (!sp.acc || accSel === cur.p.a);
              markChoice(api, i, ok, LETTER_KEYS.indexOf(cur.p.L));
              playNote(cur.m, 0.8);
              api.answer(ok, `nt:${cur.clef}:${cur.m}`, performance.now() - t0, ok ? null : `${icon('x')} It’s <b>${noteLabel(cur.p)}</b>.`);
            });
          }
        },
      };
    },
  },

  /* ---- Find a key on the keyboard by name ---- */
  findkey: {
    title: 'Key finder',
    run(api) {
      const sp = api.spec;
      const letters = sp.letters || LETTER_KEYS;
      const kb = api.kb({ from: sp.from || 48, to: sp.to || 71, labels: 'none', middleC: true });
      let want = null, t0 = 0, last = null;
      return {
        ask() {
          const w = L => { const a = statAcc(`fk:${L}`); return (a === null ? 1.2 : 1.6 - a) + (L === last ? -10 : 0); };
          want = weighted(api.r, letters, L => Math.max(0.05, w(L)));
          last = want;
          const exact = sp.middleC && want === 'C' && api.r() < 0.35;
          api.mark(exact ? 60 : mod(pm(want + '4'), 12));
          api.sh.q.innerHTML = `<div class="big-letter">${pretty(want)}</div><p class="prompt">${exact ? 'Find <b>Middle C</b>' : `Tap any <b>${pretty(want)}</b>`}</p>`;
          api.sh.a.innerHTML = '';
          t0 = performance.now();
          const pc = mod(pm(want + '4'), 12);
          api.input(ev => {
            if (ev.type !== 'on' || !want) return;
            const ok = exact ? ev.m === 60 : mod(ev.m, 12) === pc;
            const L = want; want = null;
            kb.flash(ev.m, ok ? 'ok' : 'bad', 600);
            if (!ok) { for (let m = kb.from; m <= kb.to; m++) if (exact ? m === 60 : mod(m, 12) === pc) kb.flash(m, 'target', 1400); }
            api.answer(ok, `fk:${L}`, performance.now() - t0, ok ? null : `${icon('x')} That was ${noteLabel(spell(ev.m))}. ${exact ? 'Middle C' : pretty(L)} is lit up.`);
          });
        },
      };
    },
  },

  /* ---- Black-key groups ---- */
  group: {
    title: 'Black-key groups',
    count: 6,
    run(api) {
      const kb = api.kb({ from: 48, to: 83, labels: 'none', middleC: false });
      let want = 2;
      return {
        ask() {
          want = api.r() < 0.5 ? 2 : 3;
          api.mark(want);
          api.sh.q.innerHTML = `<div class="big-letter">${want === 2 ? '2' : '3'}</div><p class="prompt">Tap a black key in a group of <b>${want === 2 ? 'two' : 'three'}</b></p>`;
          api.input(ev => {
            if (ev.type !== 'on' || !want) return;
            const pc = mod(ev.m, 12), inTwo = pc === 1 || pc === 3, inThree = [6, 8, 10].includes(pc);
            const ok = want === 2 ? inTwo : inThree;
            want = 0;
            kb.flash(ev.m, ok ? 'ok' : 'bad', 500);
            api.answer(ok, 'grp', 0, ok ? null : `${icon('x')} ${isBlack(ev.m) ? `That one’s in a group of ${inTwo ? 'two' : 'three'}.` : 'That’s a white key.'}`);
          });
        },
      };
    },
  },

  /* ---- Finger numbers ---- */
  finger: {
    title: 'Finger numbers',
    count: 8,
    run(api) {
      const names = ['thumb', 'index finger', 'middle finger', 'ring finger', 'little finger'];
      return {
        ask() {
          unlockChoices(api);
          const side = api.r() < 0.5 ? 'L' : 'R', f = 1 + Math.floor(api.r() * 5);
          api.mark(f - 1);
          api.sh.q.innerHTML = `<div class="hand-q">${handArt(side, f, { numbers: false })}</div><p class="prompt">Which number is the highlighted finger?</p>`;
          api.sh.a.innerHTML = choiceButtons(['1', '2', '3', '4', '5'], 'nums');
          onChoice(api, i => {
            const ok = i + 1 === f;
            markChoice(api, i, ok, f - 1);
            api.answer(ok, 'fingers', 0, ok ? null : `${icon('x')} The ${names[f - 1]} is <b>${f}</b>, on both hands.`);
          });
        },
      };
    },
  },

  /* ---- Ear training ---- */
  ear: {
    title: 'Ear training',
    count: 8,
    run(api) {
      const mode = api.spec.mode || 'highlow';
      let q = null;
      const again = () => { if (q && q.play) q.play(); };
      const INT = { 2: ['major 2nd', 2], 3: ['major 3rd', 4], 'm3': ['minor 3rd', 3], 4: ['perfect 4th', 5], 5: ['perfect 5th', 7], 6: ['major 6th', 9], 8: ['octave', 12] };
      const build = () => {
        const r = api.r, base = 55 + Math.floor(r() * 14);
        if (mode === 'highlow') {
          let d = (1 + Math.floor(r() * (api.spec.hard ? 4 : 9))) * (r() < 0.5 ? 1 : -1);
          return { opts: ['Higher', 'Lower'], ans: d > 0 ? 0 : 1, prompt: 'Is the second note higher or lower?', play: () => playSeq([base, base + d], 0.75, 0.7), key: 'ear:hl' };
        }
        if (mode === 'samediff') {
          const same = r() < 0.4, d = same ? 0 : (1 + Math.floor(r() * 4)) * (r() < 0.5 ? 1 : -1);
          return { opts: ['Same', 'Different'], ans: same ? 0 : 1, prompt: 'Same note twice, or two different notes?', play: () => playSeq([base, base + d], 0.75, 0.7), key: 'ear:sd' };
        }
        if (mode === 'stepskip') {
          const kind = Math.floor(r() * 3), dir = r() < 0.5 ? 1 : -1;
          const sc = scaleNotes('C', 'major', 4).concat(scaleNotes('C', 'major', 5).slice(1)).map(p => p.m);
          const i = 2 + Math.floor(r() * 7), j = kind === 0 ? i : kind === 1 ? i + dir : i + 2 * dir;
          return { opts: ['Repeat', 'Step', 'Skip'], ans: kind, prompt: 'Did it repeat, step or skip?', play: () => playSeq([sc[i], sc[j]], 0.75, 0.7), key: 'ear:ss' };
        }
        if (mode === 'interval') {
          const set = api.spec.set || [2, 3, 5, 8];
          const k = pick(r, set), [nm, semis] = INT[k];
          const asc = api.spec.harmonic ? null : r() < 0.75;
          const notes = asc === null ? [[base, base + semis]] : asc ? [base, base + semis] : [base + semis, base];
          return { opts: set.map(x => cap(INT[x][0])), ans: set.indexOf(k), prompt: 'Which interval do you hear?', play: () => playSeq(notes, 0.8, 0.75), key: `ear:int:${k}` };
        }
        if (mode === 'quality') {
          const set = api.spec.set || ['', 'm'];
          const ty = pick(r, set), root = pick(r, ['C', 'D', 'E', 'F', 'G', 'A']);
          const ms = chordPitches(root + ty, 4).map(p => p.m);
          const names = { '': 'Major', m: 'Minor', dim: 'Diminished', aug: 'Augmented', 7: 'Dominant 7th', maj7: 'Major 7th' };
          return { opts: set.map(t => names[t]), ans: set.indexOf(ty), prompt: 'What kind of chord is this?', play: () => { playChord(ms, 1.5, 0, 0.66, 0); playSeq(ms, 0.32, 0.4); }, key: `ear:q:${ty || 'M'}` };
        }
        if (mode === 'scale') {
          const ty = r() < 0.5 ? 'major' : 'minor';
          const ms = scaleNotes(pick(r, ['C', 'D', 'G', 'A']), ty, 4).map(p => p.m);
          return { opts: ['Major (bright)', 'Minor (darker)'], ans: ty === 'major' ? 0 : 1, prompt: 'Is this scale major or minor?', play: () => playSeq(ms, 0.28, 0.3), key: `ear:sc:${ty}` };
        }
        return null;
      };
      return {
        ask() {
          unlockChoices(api);
          q = build();
          api.mark(q.ans);
          api.sh.q.innerHTML = `<button type="button" class="listen-btn" aria-label="Play again">${icon('ear')}</button><p class="prompt">${q.prompt}</p>`;
          $('.listen-btn', api.sh.q).onclick = again;
          api.sh.a.innerHTML = choiceButtons(q.opts, q.opts.length > 3 ? 'grid2' : '');
          setTimeout(again, 250);
          onChoice(api, i => { const ok = i === q.ans; markChoice(api, i, ok, q.ans); api.answer(ok, q.key, 0, ok ? null : `${icon('x')} It was <b>${q.opts[q.ans]}</b>. Listen again ↑`); });
        },
        stop() { hush(); },
      };
    },
  },

  /* ---- Echo: hear a little tune, play it back ---- */
  echo: {
    title: 'Echo',
    count: 6,
    run(api) {
      const kb = api.kb({ from: 'C4', to: 'B4', labels: 'c' });
      let tune = [], got = [];
      return {
        ask() {
          const len = api.spec.len || 3;
          const sc = scaleNotes('C', 'major', 4).slice(0, api.spec.notes || 5).map(p => p.m);
          tune = [60];
          for (let i = 1; i < len; i++) tune.push(pick(api.r, sc.filter(m => Math.abs(m - tune[i - 1]) <= 4)));
          got = [];
          api.mark(tune.join(','));
          api.sh.q.innerHTML = `<button type="button" class="listen-btn" aria-label="Play again">${icon('ear')}</button><p class="prompt">Listen, then play it back. It starts on <b>Middle C</b>.</p><p class="echo-dots">${tune.map(() => '<i></i>').join('')}</p>`;
          $('.listen-btn', api.sh.q).onclick = () => playSeq(tune, 0.6, 0.55);
          setTimeout(() => playSeq(tune, 0.6, 0.55), 300);
          api.input(ev => {
            if (ev.type !== 'on' || got.length >= tune.length) return;
            const want = tune[got.length], ok = ev.m === want || (ev.src === 'mic' && mod(ev.m - want, 12) === 0);
            got.push(ok);
            const dots = $$('.echo-dots i', api.sh.q);
            if (dots[got.length - 1]) dots[got.length - 1].className = ok ? 'ok' : 'bad';
            kb.flash(ev.m, ok ? 'ok' : 'bad', 400);
            if (!ok) { api.answer(false, 'ear:echo', 0, `${icon('x')} The tune was ${tune.map(m => noteLabel(spell(m))).join(' ')}.`); got = tune.slice(); }
            else if (got.length === tune.length) api.answer(true, 'ear:echo');
          });
        },
      };
    },
  },

  /* ---- Rhythm: read a bar, tap it ---- */
  rhythm: {
    title: 'Rhythm',
    count: 5,
    run(api) {
      const sp = api.spec;
      let pat = null, taps = [], expected = [], metro = null, tm = null, judging = false;
      const pad = () => api.sh.a.querySelector('.tap-pad');
      const tapAt = t => { if (!judging) return; taps.push(t); const p = pad(); if (p) { p.classList.remove('hit'); void p.offsetWidth; p.classList.add('hit'); } };
      const onKey = e => { if (e.code === 'Space' && judging) { e.preventDefault(); tapAt(performance.now()); } };
      document.addEventListener('keydown', onKey);
      return {
        ask() {
          pat = makeRhythm(api.r, sp.level || 1, sp.time || '4/4', sp.bars || 1);
          const piece = parsePiece({ clef: 'rhythm', music: pat.text, time: pat.time });
          api.sh.q.innerHTML = '<div class="rh-score"></div><p class="prompt">Listen, then tap it in time after the count-in.</p>';
          const w = api.sh.q.clientWidth || 320;
          const sc = drawPiece($('.rh-score', api.sh.q), piece, { width: w, scale: notationScale(w), label: 'Rhythm' });
          api.sh.a.innerHTML = `<div class="rh-btns"><button type="button" class="btn ghost sm" data-rh="listen">${icon('ear')} Listen</button><button type="button" class="btn primary sm" data-rh="go">${icon('metro')} Tap it</button></div><button type="button" class="tap-pad" aria-label="Tap here">TAP</button>`;
          const tempo = sp.tempo || 72;
          const spb = 60 / tempo;
          const evs = piece.staves[0].events;
          api.sh.a.onclick = e => {
            const b = e.target.closest('[data-rh]');
            if (!b || judging) return;
            const c = ac();
            const t0 = c.currentTime + 0.15, beats = parseTime(pat.time).beats, beatSec = spb * parseTime(pat.time).beat;
            for (let k = 0; k < beats; k++) click(t0 + k * beatSec, k === 0 ? 0 : 1);
            const start = t0 + beats * beatSec;
            if (b.dataset.rh === 'listen') {
              evs.forEach(ev => { if (!ev.rest && !ev.tied) { playNote(72, Math.max(0.1, ev.d * spb * 0.8), start + ev.t * spb, 0.5); } });
              return;
            }
            for (let k = 0; k < Math.ceil(piece.len / parseTime(pat.time).beat); k++) click(start + k * beatSec, 2);
            expected = evs.filter(ev => !ev.rest && !ev.tied).map(ev => ({ t: ctxToPerf(start + ev.t * spb), i: ev.i }));
            taps = [];
            judging = true;
            sc.unmark('done'); sc.unmark('miss');
            api.sh.fb.innerHTML = `${icon('metro')} Count in… then tap!`;
            api.input(ev => { if (ev.type === 'on') tapAt(ev.at); });
            tm = setTimeout(() => {
              judging = false;
              const lat = S.prefs.latency || 0, win = Math.max(110, spb * 1000 * 0.2);
              let hits = 0;
              const used = new Set();
              expected.forEach(x => {
                let best = -1, bd = 1e9;
                taps.forEach((tp, j) => { const d = Math.abs(tp - lat - x.t); if (!used.has(j) && d < bd) { bd = d; best = j; } });
                if (best >= 0 && bd <= win) { used.add(best); hits++; sc.mark(0, x.i, 'done'); } else sc.mark(0, x.i, 'miss');
              });
              const extra = taps.length - used.size;
              const ok = hits === expected.length && extra === 0;
              api.answer(ok, `rh:${sp.level || 1}`, 0, ok ? `${icon('check')} Right in time!` : `${icon('x')} ${hits} of ${expected.length} in time${extra > 0 ? `, ${plural(extra, 'extra tap')}` : ''}. Red notes were missed.`);
            }, (start - c.currentTime) * 1000 + piece.len * spb * 1000 + 700);
          };
        },
        stop() { document.removeEventListener('keydown', onKey); clearTimeout(tm); },
      };
    },
  },

  /* ---- Steady beat ---- */
  beat: {
    title: 'Steady beat',
    count: 3,
    run(api) {
      let metro = null, taps = [], clicks = [], tm = null, on = false;
      const onKey = e => { if (e.code === 'Space' && on) { e.preventDefault(); hit(performance.now()); } };
      document.addEventListener('keydown', onKey);
      const hit = t => { if (!on) return; taps.push(t); const p = api.sh.a.querySelector('.tap-pad'); if (p) { p.classList.remove('hit'); void p.offsetWidth; p.classList.add('hit'); } };
      return {
        ask(i) {
          const bpm = [66, 80, 96][i % 3] + (api.spec.faster ? 10 : 0);
          api.sh.q.innerHTML = `<div class="beat-big"><b>${bpm}</b> beats a minute</div><p class="prompt">Tap along with the clicks. 4 to listen, then 8 to tap.</p><div class="beat-dots">${Array.from({ length: 12 }, () => '<i></i>').join('')}</div>`;
          api.sh.a.innerHTML = `<button type="button" class="btn primary sm" data-go>${icon('metro')} Start</button><button type="button" class="tap-pad" aria-label="Tap here">TAP</button>`;
          api.sh.a.querySelector('[data-go]').onclick = () => {
            taps = []; clicks = [];
            const dots = $$('.beat-dots i', api.sh.q);
            metro = metronome({ bpm, beats: 4, countIn: 12, onBeat: (b, s, t) => { if (dots[b]) dots[b].className = b < 4 ? 'cnt' : 'on'; if (b >= 4) clicks.push(ctxToPerf(t)); if (b === 3) on = true; }, onDone: () => {} });
            api.input(ev => { if (ev.type === 'on') hit(ev.at); });
            tm = setTimeout(() => {
              on = false;
              const lat = S.prefs.latency || 0;
              const offs = clicks.map(c => { let bd = 1e9; taps.forEach(tp => { const d = tp - lat - c; if (Math.abs(d) < Math.abs(bd)) bd = d; }); return bd; });
              const good = offs.filter(d => Math.abs(d) < 90).length;
              const avg = offs.length ? Math.round(sum(offs.filter(d => Math.abs(d) < 400)) / Math.max(1, offs.filter(d => Math.abs(d) < 400).length)) : 0;
              const ok = good >= Math.ceil(clicks.length * 0.75);
              api.answer(ok, 'beat', 0, `${ok ? icon('check') : icon('x')} ${good} of ${clicks.length} taps right on the beat${Math.abs(avg) > 25 ? ` · you tend to be ${avg > 0 ? 'a little late' : 'a little early'}` : ''}.`);
            }, (12 * 60) / bpm * 1000 + 900);
          };
        },
        stop() { document.removeEventListener('keydown', onKey); if (metro) metro.stop(); clearTimeout(tm); },
      };
    },
  },

  /* ---- Steps, skips and intervals on the staff ---- */
  intervals: {
    title: 'Steps and skips',
    run(api) {
      const sp = api.spec;
      return {
        ask() {
          unlockChoices(api);
          const sc = scaleNotes('C', 'major', 4).concat(scaleNotes('C', 'major', 5).slice(1));
          const maxN = sp.names ? 8 : 3;
          const i = Math.floor(api.r() * 7);
          const num = sp.names ? 2 + Math.floor(api.r() * (maxN - 1)) : 1 + Math.floor(api.r() * 3);
          const j = Math.min(sc.length - 1, i + num - 1);
          const realNum = j - i + 1;
          api.mark(sp.names ? realNum - 2 : realNum === 1 ? 0 : realNum === 2 ? 1 : 2);
          const down = api.r() < 0.4;
          const a = down ? sc[j] : sc[i], b = down ? sc[i] : sc[j];
          const pc = parsePiece({ music: `${noteFull(a).replace('♯', '#')}h ${noteFull(b).replace('♯', '#')}h`, time: '4/4' });
          api.sh.q.innerHTML = '<div class="card-note wide"></div>';
          drawPiece($('.card-note', api.sh.q), pc, { width: 220, scale: 10, label: 'Two notes' });
          playSeq([a.m, b.m], 0.6, 0.55);
          if (sp.names) {
            const opts = ['2nd', '3rd', '4th', '5th', '6th', '7th', 'Octave'];
            api.sh.a.innerHTML = choiceButtons(opts, 'grid2');
            onChoice(api, k => { const ok = k + 2 === realNum; markChoice(api, k, ok, realNum - 2); api.answer(ok, `iv:${realNum}`, 0, ok ? null : `${icon('x')} Count the lines and spaces: it’s a <b>${opts[realNum - 2]}</b>.`); });
          } else {
            const kind = realNum === 1 ? 0 : realNum === 2 ? 1 : 2;
            api.sh.a.innerHTML = choiceButtons(['Repeat', 'Step', 'Skip']);
            onChoice(api, k => { const ok = k === kind; markChoice(api, k, ok, kind); api.answer(ok, `iv:${['rep', 'step', 'skip'][kind]}`, 0, ok ? null : `${icon('x')} It’s a <b>${['repeat', 'step', 'skip'][kind]}</b>.`); });
          }
        },
      };
    },
  },

  /* ---- Build a chord ---- */
  chordbuild: {
    title: 'Build the chord',
    count: 8,
    run(api) {
      const sp = api.spec;
      const pool = sp.chords || ['C', 'F', 'G', 'Am', 'Dm', 'Em'];
      const kb = api.kb({ from: 'C4', to: 'B5', labels: 'c' });
      let want = null, sel = new Set(), t0 = 0;
      const check = () => {
        if (!want) return;
        const pcs = chordPcs(want), got = [...new Set([...sel].map(m => mod(m, 12)))];
        const okSet = got.length === pcs.length && pcs.every(pc => got.includes(pc));
        const rootOk = !sp.root || mod(Math.min(...sel), 12) === pcs[0];
        const ok = okSet && rootOk;
        const w = want; want = null;
        if (!ok) chordPitches(w, 4).forEach(p => kb.mark(p.m, 'target', noteLabel(p)));
        playChord(chordPitches(w, 4).map(p => p.m), 1.2, 0, 0.6);
        api.answer(ok, `ch:${w}`, performance.now() - t0, ok ? `${icon('check')} ${pretty(w)} = ${chordPitches(w, 4).map(noteLabel).join(' ')}` : `${icon('x')} ${pretty(w)} is ${chordPitches(w, 4).map(noteLabel).join(' – ')}${okSet && !rootOk ? ' (start from the root)' : ''}.`);
      };
      return {
        ask() {
          want = pick(api.r, pool);
          api.mark(want);
          sel = new Set();
          kb.clear();
          t0 = performance.now();
          api.sh.q.innerHTML = `<div class="big-letter">${pretty(want)}</div><p class="prompt">${sp.root ? 'Play it in root position' : 'Play this chord'}: ${S.prefs.input === 'touch' ? 'tap its notes, then <b>Check</b>' : 'hold all its notes together'}</p>`;
          api.sh.a.innerHTML = `<div class="rh-btns"><button type="button" class="btn ghost sm" data-cb="clear">Clear</button><button type="button" class="btn primary sm" data-cb="check">${icon('check')} Check</button></div>`;
          api.sh.a.onclick = e => { const b = e.target.closest('[data-cb]'); if (!b) return; if (b.dataset.cb === 'clear') { sel.clear(); kb.clear('sel'); } else if (sel.size) check(); };
          api.input(ev => {
            if (!want) return;
            if (ev.src === 'touch') {
              if (ev.type !== 'on') return;
              if (sel.has(ev.m)) { sel.delete(ev.m); kb.unmark(ev.m, 'sel'); } else { sel.add(ev.m); kb.mark(ev.m, 'sel'); }
              return;
            }
            if (ev.src === 'mic') return;
            if (ev.type === 'on') { sel = new Set(IN.down); if (sel.size >= chordPcs(want).length) setTimeout(() => { if (want) { sel = new Set([...IN.down, ...sel]); check(); } }, 220); }
          });
          if (S.prefs.input === 'mic') api.chroma(v => { if (want && chromaHas(v, chordPcs(want))) { sel = new Set(chordPitches(want, 4).map(p => p.m)); check(); } });
        },
      };
    },
  },

  /* ---- Name the chord ---- */
  chordname: {
    title: 'Name the chord',
    count: 8,
    run(api) {
      const pool = api.spec.chords || ['C', 'F', 'G', 'Am', 'Dm', 'Em'];
      return {
        ask() {
          unlockChoices(api);
          const want = pick(api.r, pool), inv = api.spec.inversions ? Math.floor(api.r() * 3) : 0;
          const ps = chordPitches(want, 4, inv);
          const pc = parsePiece({ music: `[${ps.map(p => p.L + (p.a > 0 ? '#' : p.a < 0 ? 'b' : '') + p.o).join(',')}]w`, time: '4/4' });
          api.sh.q.innerHTML = '<div class="card-note"></div>';
          drawPiece($('.card-note', api.sh.q), pc, { width: 160, scale: 11, label: 'A chord' });
          playChord(ps.map(p => p.m), 1.4);
          const opts = shuffle(api.r, [want, ...shuffle(api.r, pool.filter(x => x !== want)).slice(0, 3)]);
          api.mark(opts.indexOf(want));
          api.sh.a.innerHTML = choiceButtons(opts.map(pretty), 'grid2');
          onChoice(api, k => { const ok = opts[k] === want; markChoice(api, k, ok, opts.indexOf(want)); api.answer(ok, `cn:${want}`, 0, ok ? null : `${icon('x')} It’s <b>${pretty(want)}</b>${inv ? ` (${inv === 1 ? '1st' : '2nd'} inversion)` : ''}.`); });
        },
      };
    },
  },

  /* ---- Key signatures ---- */
  keysig: {
    title: 'Key signatures',
    count: 8,
    run(api) {
      const pool = api.spec.keys || ['C', 'G', 'F', 'D', 'Bb'];
      return {
        ask() {
          unlockChoices(api);
          const k = pick(api.r, pool);
          api.sh.q.innerHTML = '<div class="card-note"></div><p class="prompt">Which major key has this key signature?</p>';
          keyCard($('.card-note', api.sh.q), { key: k, scale: 11, width: 190, clef: api.r() < 0.7 ? 'treble' : 'bass' });
          const opts = shuffle(api.r, [k, ...shuffle(api.r, pool.filter(x => x !== k)).slice(0, 3)]);
          api.mark(opts.indexOf(k));
          api.sh.a.innerHTML = choiceButtons(opts.map(x => `${pretty(x)} major`), 'grid2');
          onChoice(api, i => { const ok = opts[i] === k; markChoice(api, i, ok, opts.indexOf(k)); api.answer(ok, `ks:${k}`, 0, ok ? null : `${icon('x')} That’s <b>${pretty(k)} major</b> (${KEY_SIGS[k] === 0 ? 'no sharps or flats' : plural(Math.abs(KEY_SIGS[k]), KEY_SIGS[k] > 0 ? 'sharp' : 'flat')}).`); });
        },
      };
    },
  },

  /* ---- Note values ---- */
  values: {
    title: 'Note values',
    count: 8,
    run(api) {
      const set = api.spec.set || ['w', 'h', 'q', 'h.'];
      const beats = { w: 4, h: 2, q: 1, e: 0.5, 'h.': 3, 'q.': 1.5, s: 0.25 };
      const fmt = b => (b === 0.5 ? '½' : b === 1.5 ? '1½' : b === 0.25 ? '¼' : String(b));
      return {
        ask() {
          unlockChoices(api);
          const v = pick(api.r, set);
          const rest = api.spec.rests && api.r() < 0.35 && v !== 'h.' && v !== 'q.';
          const ev = parseMusic(`${rest ? 'r' : 'x'}${v}`, { loose: true }).events;
          api.sh.q.innerHTML = '<div class="card-note"></div><p class="prompt">How many beats does this last (in 4/4)?</p>';
          engrave($('.card-note', api.sh.q), { staves: [{ clef: 'rhythm', events: ev }], time: null, width: 150, scale: 11, final: false, center: true, bars: [{ start: 0, len: 4 }] });
          const optsAll = [...new Set(set.map(x => beats[x]).concat([1, 2, 4, 3]))].sort((a, b) => a - b);
          api.mark(optsAll.indexOf(beats[v]));
          api.sh.a.innerHTML = choiceButtons(optsAll.map(fmt), 'nums');
          onChoice(api, i => { const ok = optsAll[i] === beats[v]; markChoice(api, i, ok, optsAll.indexOf(beats[v])); api.answer(ok, `nv:${v}`, 0, ok ? null : `${icon('x')} ${fmt(beats[v])} ${beats[v] === 1 ? 'beat' : 'beats'}.`); });
        },
      };
    },
  },

  /* ---- Mixed review questions (from lessons you've done) ---- */
  quiz: {
    title: 'Quick review',
    count: 6,
    run(api) {
      const qs = shuffle(api.r, api.spec.questions || []);
      return {
        ask(i) {
          unlockChoices(api);
          const q = qs[i % qs.length];
          if (!q) { api.answer(true); return; }
          api.sh.q.innerHTML = `${q.staff ? '<div class="card-note wide"></div>' : ''}<p class="prompt q">${rich(q.q)}</p>`;
          if (q.staff) { const pc = parsePiece({ music: q.staff, time: q.time || '4/4', clef: q.clef || 'treble', key: q.key }); drawPiece($('.card-note', api.sh.q), Object.assign(pc, { errors: [] }), { width: 240, scale: 9, label: 'Example' }); }
          const order = shuffle(api.r, q.opts.map((o, k) => k));
          api.mark(order.indexOf(q.ans));
          api.sh.a.innerHTML = choiceButtons(order.map(k => rich(q.opts[k])), q.opts.length > 3 ? 'grid2' : '');
          onChoice(api, k => { const ok = order[k] === q.ans; markChoice(api, k, ok, order.indexOf(q.ans)); api.answer(ok, null, 0, ok ? (q.why ? `${icon('check')} ${rich(q.why)}` : null) : `${icon('x')} ${q.why ? rich(q.why) : `It’s ${rich(q.opts[q.ans])}.`}`); });
        },
      };
    },
  },
};

// Random rhythms built from the values you've learned. level 1: crotchets & minims; 2: + rests & dotted minims; 3: + quavers; 4: + dotted crotchets.
function makeRhythm(r, level = 1, time = '4/4', bars = 1) {
  const tm = parseTime(time);
  const cells = [['xq', 1], ['xh', 2], ['xw', 4]];
  if (level >= 2) cells.push(['rq', 1], ['xh.', 3], ['rh', 2]);
  if (level >= 3) cells.push(['xe xe', 1], ['xe xe', 1], ['xq xe xe', 2]);
  if (level >= 4) cells.push(['xq. xe', 2], ['xq. xe', 2]);
  const out = [];
  for (let b = 0; b < bars; b++) {
    let left = tm.barLen, bar = [], hits = 0;
    let guard = 0;
    while (left > 1e-6 && guard++ < 50) {
      const fit = cells.filter(([, d]) => d <= left + 1e-6 && !(d === 4 && bars === 1 && b === 0));
      const c = pick(r, fit.length ? fit : [['xq', 1]]);
      bar.push(c[0]);
      if (c[0][0] === 'x') hits++;
      left -= c[1];
    }
    if (!hits) bar[0] = bar[0].replace(/^r/, 'x');
    out.push(bar.join(' '));
  }
  return { text: out.join(' | '), time };
}
