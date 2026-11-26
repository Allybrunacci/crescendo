/* Crescendo — away from the piano: days built from theory studies and drills that need no piano, the theory study
   player, the Theory pages under Learn, and song study (learning a song in your head) */
'use strict';

const hasStudies = () => typeof STUDIES !== 'undefined' && Array.isArray(STUDIES) && STUDIES.length > 0;
const STUDY_BY_ID = {};
if (hasStudies()) STUDIES.forEach(s => { STUDY_BY_ID[s.id] = s; });
const studyDone = id => !!(S.theory[id] && S.theory[id].done);
const studiesDone = () => (hasStudies() ? STUDIES.filter(s => studyDone(s.id)).length : 0);
const studyNo = st => `${st.u}.${STUDIES.filter(x => x.u === st.u).indexOf(st) + 1}`;
// Theory can run a unit ahead of your lessons, so an away day always has something new to read.
const theoryUnit = () => Math.min(8, curLevel() + 1);
function nextStudy(skip) {
  if (!hasStudies()) return null;
  return STUDIES.find(s => s.id !== skip && !studyDone(s.id) && s.u <= theoryUnit()) || null;
}
// A study you've done that's due for a refresher (oldest first).
function dueStudy(skip) {
  if (!hasStudies()) return null;
  const t = today();
  return STUDIES.filter(s => s.id !== skip && studyDone(s.id) && (S.theory[s.id].due || t) <= t)
    .sort((a, b) => (S.theory[a.id].due || '').localeCompare(S.theory[b.id].due || ''))[0] || null;
}

/* ---------- where are you practising today? ---------- */
const isAway = d => (d in S.away ? !!S.away[d] : !!S.awayWeek[dowOf(d)]);
function setAway(d, away) {
  if (!!S.awayWeek[dowOf(d)] === away) delete S.away[d]; else S.away[d] = away ? 1 : 0;
  save();
}

/* ---------- theory drills for away days ---------- */
function knownKeys() {
  const set = new Set(['C']);
  skillIds('scales').forEach(k => { const sc = SKILLS[k].scale; if (sc && / major$/.test(sc)) set.add(sc.split(' ')[0]); });
  skillIds('review').forEach(k => (SKILLS[k].keys || []).forEach(x => set.add(x)));
  if (hasSkill('keysig1') || studyDone('th-keysigs')) ['G', 'F', 'D', 'Bb'].forEach(x => set.add(x));
  if (studyDone('th-keysigs')) ['A', 'Eb'].forEach(x => set.add(x));
  if (hasSkill('circle') || hasSkill('keysig3') || studyDone('th-circle')) ['A', 'E', 'Eb', 'Ab', 'B', 'Db'].forEach(x => set.add(x));
  return [...set].filter(k => KEY_SIGS[k] !== undefined);
}
const theoryLevel = () => Math.max(curLevel(), ...(hasStudies() ? STUDIES.filter(s => studyDone(s.id)).map(s => s.u) : [1]));
const simpleTimes = () => RTIMES().filter(t => t !== '6/8');
// The drills an away day can use, from your lessons and studies: name → spec.
const THEORY_DRILLS = {
  values: { name: 'Note values', ok: () => true, spec: () => ({ k: 'values', set: hasSkill('rhythm3') ? ['w', 'h', 'q', 'e', 'h.', 'q.'] : hasSkill('rhythm2') || studyDone('th-rests') ? ['w', 'h', 'q', 'h.'] : ['w', 'h', 'q'], rests: hasSkill('rhythm2') || studyDone('th-rests') }) },
  terms: { name: 'Musical terms', ok: () => true, spec: () => ({ k: 'terms', level: theoryLevel() }) },
  barmath: { name: 'Complete the bar', ok: () => hasSkill('time') || studyDone('th-time'), spec: r => ({ k: 'barmath', level: RLEVEL(), time: pick(r, simpleTimes()) }) },
  rhythmhear: { name: 'Rhythm dictation', ok: () => hasSkill('rhythm1') || studyDone('th-values'), spec: r => ({ k: 'rhythmhear', level: RLEVEL(), time: pick(r, simpleTimes()) }) },
  scalespell: { name: 'Scales on paper', ok: () => hasSkill('scale-C') || studyDone('th-major'), spec: () => ({ k: 'scalespell', keys: knownKeys().concat(hasSkill('scale-Am') || studyDone('th-minor') ? ['Am'] : []), names: studyDone('th-degrees') }) },
  keyfind: { name: 'Keys and key signatures', ok: () => hasSkill('keysig1') || studyDone('th-keysigs'), spec: () => ({ k: 'keyfind', keys: knownKeys() }) },
  keysig: { name: 'Key signatures', ok: () => hasSkill('keysig1') || studyDone('th-keysigs'), spec: () => ({ k: 'keysig', keys: knownKeys() }) },
  intervals: { name: 'Steps and skips', ok: () => hasSkill('steps') || studyDone('th-steps'), spec: () => ({ k: 'intervals', names: hasSkill('intervals') || studyDone('th-intervals') }) },
  ivqual: { name: 'Interval names', ok: () => hasSkill('intervals') || studyDone('th-quality'), spec: () => ({ k: 'ivqual', set: ['M2', 'm3', 'M3', 'P4', 'P5', 'M6', 'P8'] }) },
  chordspell: { name: 'Chords on paper', ok: () => hasSkill('triads') || studyDone('th-triads'), spec: () => ({ k: 'chordspell', chords: chordPool() }) },
  chordname: { name: 'Name the chord', ok: () => hasSkill('triads') || studyDone('th-symbols'), spec: () => ({ k: 'chordname', chords: chordPool(), inversions: hasSkill('inversions') || studyDone('th-inversions') }) },
  roman: { name: 'Roman numerals', ok: () => hasSkill('romans') || studyDone('th-romans'), spec: () => ({ k: 'roman', keys: knownKeys().filter(k => ['C', 'G', 'F', 'D', 'A', 'Bb'].includes(k)) }) },
};
const theoryDrillPool = () => Object.keys(THEORY_DRILLS).filter(k => THEORY_DRILLS[k].ok());

/* ---------- the away plan ---------- */
function awayCandidates(d, M) {
  const r = rng(`away:${d}`), day = daysBetween(S.created, d), out = [];
  const add = (k, w, min, max, pri, ref) => out.push({ k, w, min, max, pri: pri + (r() - 0.5) * 0.4, ref });
  const ns = nextStudy();
  if (ns) {
    add('study', 3.4, Math.min(ns.mins, Math.max(3, M - 2)), ns.mins + 4, 1, ns.id);
    const ns2 = nextStudy(ns.id), due = dueStudy();
    if (ns2 && M >= ns.mins + ns2.mins + 8) add('study', 2.6, ns2.mins, ns2.mins + 3, 2.5, ns2.id);
    else if (due && M >= 30) add('study', 1.6, Math.min(due.mins, 6), due.mins + 2, 6, due.id);
  } else {
    const due = dueStudy();
    if (due) add('study', 2.4, Math.min(due.mins, Math.max(3, M - 2)), due.mins + 3, 2, due.id);
  }
  const rot = k => ((day + ['read', 'rhythm', 'ear', 'review', 'score'].indexOf(k)) % 3) * 0.6;
  if (skillIds('read').length) add('read', 2, 2, 8, 3 - (dueCount('read') ? 0.5 : 0) + rot('read'));
  const pool = theoryDrillPool(), first = pool[day % pool.length];
  add('tdrill', 2, 2, 8, 3.2, first);
  if (M >= 20 && pool.length > 1) add('tdrill', 1.6, 2, 7, 5.5, pool[(day + Math.ceil(pool.length / 2)) % pool.length]);
  if (skillIds('rhythm').length) add('rhythm', 1.2, 2, 5, 5 + rot('rhythm') - (dueCount('rhythm') ? 0.5 : 0));
  const ears = skillIds('ear');
  add('ear', 1.2, 2, 6, 5.2 + rot('ear'), ears.length ? ears[day % ears.length] : '');
  if (reviewQuestions().length >= 3) add('review', 1.2, 2, 5, 4.5 + rot('review') - (dueCount('review') ? 0.5 : 0));
  const songs = unlockedSongs(), f = songs.length ? focusSong(songs) : null;
  if (f) add('score', 1.6, 3, 10, 4 + rot('score'), f.id);
  // Fewer, longer activities: about one for every 6 minutes.
  return out.sort((a, b) => a.pri - b.pri).slice(0, clamp(2 + Math.floor(M / 6), 2, 9));
}

/* ---------- song study: learning a song in your head ---------- */
// A staff you can listen to, with the notes lighting up as they play. Returns a cleanup function.
function listenStaff(host, piece, opts = {}) {
  const w = Math.min(host.clientWidth || 340, 640);
  host.innerHTML = `<div class="staff-host"></div><div class="btn-row center"><button type="button" class="btn ghost sm" data-listen>${icon('play')} ${opts.label || 'Listen and follow'}</button>
    <div class="tempo" role="group" aria-label="Speed"><button type="button" class="icon-btn sm" data-tm="-8" aria-label="Slower">${icon('minus')}</button><span><b class="tv">${opts.tempo}</b><small>bpm</small></span><button type="button" class="icon-btn sm" data-tm="8" aria-label="Faster">${icon('plus')}</button></div></div>`;
  let tempo = opts.tempo || piece.tempo || 80, sched = null;
  const sc = drawPiece($('.staff-host', host), piece, { width: w, scale: notationScale(w), fingers: S.prefs.fingers, labels: opts.labels, label: opts.title || 'Music' });
  sc.svg.addEventListener('click', e => { const g = e.target.closest('.ev'); if (!g) return; const ev = sc.staves[+g.dataset.s].events[+g.dataset.i]; if (!ev.rest) playChord(eventMidis(ev), 0.9); });
  const stop = () => { if (sched) sched.stop(); sched = null; hush(); $('[data-listen]', host).innerHTML = `${icon('play')} ${opts.label || 'Listen and follow'}`; };
  $('[data-listen]', host).onclick = () => {
    if (sched) { stop(); return; }
    const items = [];
    piece.staves.forEach((sv, s) => sv.events.forEach((ev, i) => { if (!ev.rest && !ev.tied) items.push({ at: ev.t, d: ev.d, ms: eventMidis(ev), s, i }); }));
    items.sort((a, b) => a.at - b.at);
    const spb = secPerQ(tempo, parseTime(piece.time));
    $('[data-listen]', host).innerHTML = `${icon('stop')} Stop`;
    sched = scheduler(items, spb, {
      end: piece.len,
      fn: (t, it) => {
        playChord(it.ms, Math.max(0.15, it.d * spb * 0.92), t, 0.66);
        setTimeout(() => { const g = sc.elFor(it.s, it.i) || sc.el(it.s, it.i); if (g) { g.classList.add('on'); setTimeout(() => g.classList.remove('on'), Math.max(150, it.d * spb * 900)); } }, Math.max(0, (t - audioNow()) * 1000));
      },
      done: () => { sched = null; $('[data-listen]', host).innerHTML = `${icon('play')} ${opts.label || 'Listen and follow'}`; },
    });
  };
  host.addEventListener('click', e => { const b = e.target.closest('[data-tm]'); if (!b) return; tempo = clamp(tempo + +b.dataset.tm, 40, 200); $('.tv', host).textContent = tempo; if (sched) stop(); });
  return stop;
}
const SCORE_STEPS = [
  'Listen once while your eyes follow the notes as they light up.',
  'Find the trickiest {bar} and name every note in it out loud.',
  'Tap the rhythm on your leg while counting the beats out loud.',
  'Play it on a table or your knee: press the right fingers in time, slowly.',
  'Close your eyes, hear the tune in your head and picture your hands playing it.',
];
function scoreStudy(host, id) {
  const s = SONG_BY_ID[id];
  if (!s) { host.innerHTML = '<p class="muted">Song not found.</p>'; return null; }
  host.innerHTML = `<div class="block-intro"><h2>${esc(s.title)}</h2><p class="muted">${esc(s.by)}</p>
    <p class="small">Learn your song in your head. Studying the music away from the keys makes it much easier to play when you’re back at the piano.</p></div>
    <div class="score-host"></div><h3 class="sec">Try each step</h3>
    <ol class="do-list study-steps">${SCORE_STEPS.map((x, j) => `<li><label><input type="checkbox" data-j="${j}"><span>${rich(x)}</span></label></li>`).join('')}</ol>`;
  return listenStaff($('.score-host', host), pieceOf(s), { tempo: Math.round(s.tempo * 0.85), title: s.title });
}

/* ---------- the theory study player ---------- */
function runStudy(host, id, opts = {}) {
  const st = STUDY_BY_ID[id];
  if (!st) { host.innerHTML = '<p class="muted">Study not found.</p>'; return { stop() {} }; }
  const rec = S.theory[id] || { done: '', at: 0, n: 0, lvl: 0, due: '' };
  let i = rec.done ? 0 : Math.min(rec.at || 0, st.cards.length - 1);
  let cleanup = null, answered = false;
  host.innerHTML = `<div class="lesson-player study-player${opts.embedded ? ' embedded' : ''}">
    <div class="lp-top">${opts.embedded ? '' : `<button type="button" class="icon-btn" data-lp="exit" aria-label="Close study">${icon('close')}</button>`}
      <div class="lp-prog"><div class="bar"><i></i></div><small class="lp-name"></small></div></div>
    <div class="lp-card"></div>
    <div class="lp-foot"><button type="button" class="btn ghost" data-lp="back">${icon('chev-l')} Back</button><button type="button" class="btn primary" data-lp="next">Next ${icon('chev-r')}</button></div></div>`;
  const root = host.firstElementChild, cardEl = $('.lp-card', root);
  function show() {
    if (cleanup) { cleanup(); cleanup = null; }
    hush();
    const c = st.cards[i];
    answered = c.t !== 'quiz';
    $('.lp-prog .bar i', root).style.width = `${Math.round(((i + 1) / (st.cards.length + 1)) * 100)}%`;
    $('.lp-name', root).textContent = `Theory ${studyNo(st)} · ${T(st.title)} · ${i + 1} of ${st.cards.length}`;
    cardEl.innerHTML = '';
    cardEl.className = `lp-card t-${c.t}`;
    cleanup = renderCard(cardEl, c, st, () => { answered = true; foot(); });
    foot();
    S.theory[id] = Object.assign(S.theory[id] || { done: '', n: 0, lvl: 0, due: '' }, { at: i });
    save();
    window.scrollTo(0, 0);
  }
  function foot() {
    const nx = $('[data-lp="next"]', root), c = st.cards[i];
    $('[data-lp="back"]', root).disabled = i === 0;
    nx.disabled = !answered && c.t !== 'drill';
    nx.innerHTML = i === st.cards.length - 1 ? `${icon('check')} Finish` : c.t === 'drill' && !answered ? `Skip ${icon('chev-r')}` : `Next ${icon('chev-r')}`;
  }
  function finish() {
    if (cleanup) { cleanup(); cleanup = null; }
    const first = !studyDone(id), old = S.theory[id] || {};
    const lvl = Math.min(6, (old.lvl || 0) + 1);
    S.theory[id] = { done: old.done || today(), at: 0, n: (old.n || 0) + 1, lvl, due: addDays(today(), REVIEW_DAYS[lvl]) };
    checkBadges();
    save();
    const nx = nextStudy();
    cardEl.className = 'lp-card t-done';
    cardEl.innerHTML = `<div class="done-card"><div class="mascot-done">${mascot('cheer')}</div><h2>${first ? 'Study complete!' : 'Nice refresher!'}</h2><p class="lead">${esc(T(st.title))}</p>
      <div class="added"><b>What happens next</b><ul><li>Its questions join your quick reviews.</li><li>A refresher comes round in ${plural(REVIEW_DAYS[lvl], 'day')}.</li>${nx ? `<li>Next study: ${esc(T(nx.title))}</li>` : ''}</ul></div></div>`;
    $('.lp-foot', root).innerHTML = opts.embedded ? '' : `<a class="btn ghost" href="#/theory">${icon('list')} All theory</a>${nx ? `<a class="btn primary" href="#/theory/${nx.id}">Next study ${icon('chev-r')}</a>` : ''}`;
    if (first) confetti(24);
    if (opts.onDone) opts.onDone(first);
  }
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-lp]');
    if (!b || b.disabled) return;
    if (b.dataset.lp === 'exit') { if (opts.onExit) opts.onExit(); return; }
    if (b.dataset.lp === 'back' && i > 0) { i--; show(); }
    if (b.dataset.lp === 'next') { if (i < st.cards.length - 1) { i++; show(); } else finish(); }
  });
  show();
  return { stop() { if (cleanup) cleanup(); cleanup = null; hush(); } };
}

/* ---------- Learn › Theory ---------- */
const learnTabs = cur => `<div class="seg learn-seg" role="tablist" aria-label="Learn"><a role="tab" href="#/learn" class="${cur === 'lessons' ? 'on' : ''}" aria-selected="${cur === 'lessons'}">${icon('piano')} Lessons</a><a role="tab" href="#/theory" class="${cur === 'theory' ? 'on' : ''}" aria-selected="${cur === 'theory'}">${icon('pencil')} Theory</a></div>`;
VIEWS.theory = {
  title: 'Theory',
  tab: 'learn',
  stage: p => !!p,
  render(param) {
    if (param && STUDY_BY_ID[param]) return '<div class="stage-wrap"><div id="study-host"></div></div>';
    if (!hasStudies()) return `<section class="page-head"><h1>Learn</h1>${learnTabs('theory')}</section><p class="muted">Theory studies are on their way.</p>`;
    const n = studiesDone(), nx = nextStudy() || STUDIES.find(s => !studyDone(s.id));
    let html = `<section class="page-head"><h1>Learn</h1>${learnTabs('theory')}
      <p class="muted">${n} of ${STUDIES.length} theory studies done · no piano needed${nx ? ` · next: ${esc(T(nx.title))}` : ''}</p>
      <div class="bar big"><i style="width:${Math.round((n / STUDIES.length) * 100)}%"></i></div></section>
      <div class="card tip"><span class="tip-ico">${icon('pencil')}</span><div><b>Theory you can do anywhere</b><p>Short readings with examples you can hear, quick questions and a task for pencil and paper. On days you can’t get to the piano, choose <b>Away from the piano</b> on Today and your plan is built from these.</p></div></div>`;
    UNITS.forEach(u => {
      const ss = STUDIES.filter(s => s.u === u.n), d = ss.filter(s => studyDone(s.id)).length;
      if (!ss.length) return;
      const open = nx ? nx.u === u.n : false;
      html += `<details class="card unit${d === ss.length ? ' complete' : ''}"${open ? ' open' : ''}><summary>
        <span class="u-num">${d === ss.length ? icon('check') : u.n}</span><span class="u-txt"><b>${esc(u.title)}</b><small>${d}/${ss.length} studies${u.n > theoryUnit() ? ' · ahead of your lessons' : ''}</small></span>${icon('chev-d', 'chev')}</summary>
        <ol class="lessons">${ss.map(s => {
          const rec = S.theory[s.id] || {}, cur = nx && nx.id === s.id;
          return `<li><a class="lesson${rec.done ? ' done' : ''}${cur ? ' cur' : ''}" href="#/theory/${s.id}">
            <span class="l-ico">${rec.done ? icon('check') : cur ? icon('play') : studyNo(s)}</span>
            <span class="l-txt"><b>${esc(T(s.title))}</b><small>${s.mins} min${rec.done ? (rec.due && rec.due <= today() ? ' · refresher due' : ` · done ${fmtShort(rec.done)}`) : rec.at ? ' · in progress' : ''}</small></span></a></li>`;
        }).join('')}</ol></details>`;
    });
    return html;
  },
  after(view, param) {
    if (!param || !STUDY_BY_ID[param]) return null;
    const ctl = runStudy($('#study-host', view), param, { onExit: () => go('#/theory') });
    trackStart('study', param);
    return () => ctl.stop();
  },
};
