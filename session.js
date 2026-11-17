/* Crescendo — the practice session: one activity at a time, with a timer, then a summary */
'use strict';

const RLEVEL = () => Math.max(1, ...skillIds('rhythm').map(k => SKILLS[k].rlevel || 1));
const RTIMES = () => ['4/4', ...skillIds('rhythm').map(k => SKILLS[k].rtime).filter(Boolean)];
function chordPool() {
  const set = new Set();
  skillIds('chords').forEach(k => (SKILLS[k].chords || []).forEach(c => set.add(c)));
  return set.size ? [...set] : ['C', 'F', 'G'];
}
const readMode = () => (S.prefs.input === 'midi' && IN.midi.status === 'on' ? 'keys' : daysBetween(S.created, today()) % 2 ? 'keys' : 'letters');

// Runs one activity inside host. Returns a cleanup function.
function runBlock(host, b, ctx) {
  const r = rng(`${today()}:${b.id}:${Date.now() % 1000}`);
  const done = res => ctx.result(res);
  const drill = spec => { const c = runDrill(host, { doneLabel: false, ...spec }, done); return () => c.stop(); };
  if (b.k === 'lesson') {
    const ctl = runLesson(host, b.ref, { embedded: true, onDone: () => ctx.finished() });
    return () => ctl.stop();
  }
  if (b.k === 'song') {
    const s = SONG_BY_ID[b.ref];
    if (!s) { host.innerHTML = '<p class="muted">Song not found.</p>'; return null; }
    const sp = S.songs[s.id] || {};
    host.innerHTML = `<div class="block-intro"><h2>${esc(s.title)}</h2><p class="muted">${esc(s.by)}${sp.stars ? ` · ${'★'.repeat(sp.stars)}${'☆'.repeat(3 - sp.stars)}` : ''}</p><p class="small">${esc(s.about)}</p></div><div class="player-host"></div>`;
    const tempo = Math.round(s.tempo * (sp.best >= 95 ? 1 : sp.best ? Math.max(0.6, sp.best / 100 + 0.05) : 0.75));
    const pl = createPlayer($('.player-host', host), pieceOf(s), { level: s.level, tempo, hands: s.lh && !hasSkill('together') ? 'R' : undefined,
      onFinish: res => { recordSong(s.id, res); done({ score: res.acc }); }, onRate: n => { const x = S.songs[s.id]; x.stars = Math.max(x.stars, n); save(); } });
    return () => pl.destroy();
  }
  if (b.k === 'warmup') {
    const w = WARMUPS[b.ref] || WARMUPS['five-c'];
    host.innerHTML = `<div class="block-intro"><h2>${esc(w.name)}</h2><p class="small">${esc(w.tip)}</p></div><div class="player-host"></div>`;
    const pl = createPlayer($('.player-host', host), parsePiece({ ...w, key: 'C', time: '4/4' }), { tempo: w.tempo, hands: hasSkill('together') ? 'RL' : 'R', level: 2, labels: false, onFinish: res => done({ score: res.acc }) });
    return () => pl.destroy();
  }
  if (b.k === 'scales') {
    const name = b.ref || 'C major';
    host.innerHTML = `<div class="block-intro"><h2>${esc(pretty(name))} scale</h2><p class="small">Up and down one octave. Hands separately first, then together when it’s easy.</p></div><div class="player-host"></div>`;
    const pl = createPlayer($('.player-host', host), scalePiece(name, 'RL'), { tempo: 72, hands: 'R', level: 4, labels: false, onFinish: res => { const k = Object.keys(SKILLS).find(x => SKILLS[x].scale === name); if (k && res.acc !== null) skillResult(k, res.acc); done({ score: res.acc }); } });
    return () => pl.destroy();
  }
  if (b.k === 'chords') {
    if (b.ref) {
      const prog = PROGRESSIONS.find(p => p.id === b.ref);
      host.innerHTML = `<div class="block-intro"><h2>${esc(prog.nick)}</h2><p class="muted">${esc(prog.name)} in ${keyName(prog.key)}</p><p class="small">${esc(prog.about)} Play it a few times, then try it from memory.</p></div><div class="player-host"></div>`;
      const pl = createPlayer($('.player-host', host), progPiece(prog.id, null, 'pulse'), { tempo: 72, level: 5, labels: false, onFinish: res => { const k = Object.keys(SKILLS).find(x => SKILLS[x].prog === prog.id); if (k && res.acc !== null) skillResult(k, res.acc); done({ score: res.acc }); } });
      return () => pl.destroy();
    }
    const sk = skillIds('chords');
    return drill({ k: r() < 0.65 ? 'chordbuild' : 'chordname', chords: chordPool(), inversions: sk.includes('inversions'), skill: sk[Math.floor(r() * sk.length)] });
  }
  if (b.k === 'read') {
    const rs = readRanges();
    return drill({ k: 'read', ranges: rs, acc: hasSkill('sharps') && r() < 0.4, flats: true, answer: readMode(), count: 12, skill: skillIds('read').slice(-1)[0] });
  }
  if (b.k === 'keys') return drill(hasSkill('keynames') ? { k: 'findkey', middleC: true, count: 10, skill: 'keynames' } : { k: 'group', count: 6, skill: 'groups' });
  if (b.k === 'rhythm') {
    if (!hasSkill('rhythm1')) return drill({ k: 'beat', count: 2, skill: 'beat' });
    const ts = RTIMES();
    return drill({ k: 'rhythm', level: RLEVEL(), time: pick(r, ts), count: 4, skill: skillIds('rhythm').slice(-1)[0] });
  }
  if (b.k === 'ear') {
    const sk = SKILLS[b.ref] && SKILLS[b.ref].ear ? b.ref : skillIds('ear')[0];
    const e = (SKILLS[sk] && SKILLS[sk].ear) || { mode: 'highlow' };
    return drill({ k: e.mode === 'echo' ? 'echo' : 'ear', ...e, count: 8, skill: sk });
  }
  if (b.k === 'review') {
    const qs = reviewQuestions();
    const keys = [...new Set([].concat(...skillIds('review').map(k => SKILLS[k].keys || [])))];
    if (keys.length >= 3 && r() < 0.35) return drill({ k: 'keysig', keys, count: 6, skill: 'keysig1' });
    if (hasSkill('intervals') && r() < 0.3) return drill({ k: 'intervals', names: true, count: 8, skill: 'intervals' });
    return drill({ k: 'quiz', questions: qs, count: Math.min(6, qs.length), skill: skillIds('review').filter(k => S.skills[k].due <= today())[0] });
  }
  if (b.k === 'sight') {
    const lvl = Math.min(7, curLevel());
    host.innerHTML = `<div class="block-intro"><h2>Sight-reading</h2><p class="small">Something new to read. Spend 30 seconds looking (key, time signature, highest and lowest notes), then play it once without stopping.</p>
      <button type="button" class="btn ghost sm" data-new>${icon('redo')} Another one</button></div><div class="player-host"></div>`;
    let pl = null;
    const make = () => { if (pl) pl.destroy(); pl = createPlayer($('.player-host', host), sightPiece(rng(Date.now()), lvl), { tempo: 66, level: lvl, labels: false, showTempo: true, onFinish: res => { if (res.acc !== null) skillResult('sight', res.acc); done({ score: res.acc }); } }); };
    $('[data-new]', host).onclick = make;
    make();
    return () => pl && pl.destroy();
  }
  if (b.k === 'free') return freePlay(host);
  host.innerHTML = '<p class="muted">Nothing to do here.</p>';
  return null;
}

function freePlay(host) {
  const ideas = hasSkill('improv')
    ? ['Loop C–G–Am–F in your left hand and improvise with C D E G A on top.', 'Play the 12-bar blues and try the blues scale: C E♭ F F♯ G B♭.', 'Make up an 8-bar tune: question (end on G), answer (end on C).']
    : ['Make up a tune using only the black keys.', 'Play your favourite song from memory.', 'Play C, F and G chords and hum along.', 'Find a tune you know by ear, starting on C.'];
  host.innerHTML = `<div class="block-intro"><h2>Free play</h2><p class="small">No rules. Explore, enjoy and play what you love. Here are a few ideas:</p><ul class="ideas">${ideas.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>
    <div class="heard" aria-live="polite"><span class="h-l">You’re playing</span><b class="h-n">–</b><small class="h-c"></small></div><div class="kb-host"></div>`;
  const kb = createKeyboard($('.kb-host', host), { from: 'C3', to: 'B5', labels: 'c' });
  const show = () => {
    const ms = [...IN.down].sort((a, b) => a - b);
    $('.h-n', host).textContent = ms.length ? ms.map(m => noteFull(spell(m))).join(' ') : '–';
    const ch = identifyChord(ms);
    $('.h-c', host).textContent = ch.length ? `${pretty(ch[0])} chord` : '';
  };
  const un = onInput(() => setTimeout(show, 0), true);
  return () => { un(); kb.destroy(); };
}

/* ---------- the session screen ---------- */
VIEWS.session = {
  title: 'Practice',
  stage: () => true,
  render(param) {
    const p = planFor(today());
    if (param === 'end' || !p.blocks.length) return sessionSummary(p);
    const i = clamp(+param || 0, 0, p.blocks.length - 1), b = p.blocks[i], tt = blockTitle(b);
    return `<div class="session">
      <header class="ss-top"><button type="button" class="icon-btn" data-act="exit" aria-label="Back to Today">${icon('close')}</button>
        <div class="ss-mid"><div class="ss-dots">${p.blocks.map((x, j) => `<i class="${p.done[x.id] ? 'done' : ''}${j === i ? ' cur' : ''}"></i>`).join('')}</div>
        <b class="ss-title">${esc(tt.t)}</b></div>
        <div class="ss-timer" role="timer" aria-label="Time on this activity"><span class="tm">0:00</span><small>/ ${b.mins} min</small></div></header>
      <div class="ss-body"></div>
      <footer class="ss-foot"><button type="button" class="btn ghost" data-act="prev" ${i === 0 ? 'disabled' : ''}>${icon('chev-l')}</button>
        <button type="button" class="btn primary grow" data-act="next">${i === p.blocks.length - 1 ? `${icon('check')} Finish session` : `Done · next ${icon('chev-r')}`}</button></footer></div>`;
  },
  after(view, param) {
    const p = planFor(today());
    if (param === 'end' || !p.blocks.length) {
      const lg = S.log[today()] || (S.log[today()] = { mins: 0, parts: {}, sessions: 0, feel: 0, note: '' });
      $$('[data-feel]', view).forEach(b => b.onclick = () => { lg.feel = +b.dataset.feel; save(); $$('[data-feel]', view).forEach(x => x.classList.toggle('on', x === b)); });
      const n = $('#sess-note', view);
      if (n) n.oninput = () => { lg.note = n.value.slice(0, 500); clearTimeout(n._t); n._t = setTimeout(save, 400); };
      return null;
    }
    const i = clamp(+param || 0, 0, p.blocks.length - 1), b = p.blocks[i];
    const t0 = performance.now();
    let warned = false, hiddenAt = 0, paused = 0;
    const tmEl = $('.tm', view);
    const tick = () => {
      const secs = Math.floor((performance.now() - t0 - paused) / 1000);
      tmEl.textContent = `${Math.floor(secs / 60)}:${pad(secs % 60)}`;
      if (!warned && secs >= b.mins * 60) {
        warned = true;
        $('.ss-timer', view).classList.add('over');
        playChord([79, 84], 0.6, 0, 0.25, 0.12);
        toast(`${icon('clock')} Time’s up for this one. Finish up, or tap <b>Done</b> when you’re ready.`, { ms: 5000 });
      }
    };
    const timer = setInterval(tick, 500);
    const vis = () => { if (document.hidden) hiddenAt = performance.now(); else if (hiddenAt) { paused += performance.now() - hiddenAt; hiddenAt = 0; } };
    document.addEventListener('visibilitychange', vis);
    trackStart(b.k, b.ref);
    let result = null;
    const clean = runBlock($('.ss-body', view), b, {
      result: res => { result = res; },
      finished: () => { p.done[b.id] = Math.max(1, Math.round((performance.now() - t0) / 60000)); save(); const nx = $('[data-act="next"]', view); if (nx) nx.classList.add('pulse'); },
    });
    VIEWS.session._mark = () => { p.done[b.id] = Math.max(1, Math.round((performance.now() - t0 - paused) / 60000)); };
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', vis); if (clean) clean(); };
  },
  act: {
    exit() { go('#/today'); },
    prev() { const i = +UI.param || 0; if (i > 0) go(`#/session/${i - 1}`); },
    next() {
      const p = planFor(today()), i = clamp(+UI.param || 0, 0, p.blocks.length - 1);
      if (VIEWS.session._mark) VIEWS.session._mark();
      save();
      const nextI = p.blocks.findIndex((b, j) => j > i && !p.done[b.id]);
      if (nextI >= 0) go(`#/session/${nextI}`);
      else {
        const lg = S.log[today()] || (S.log[today()] = { mins: 0, parts: {}, sessions: 0, feel: 0, note: '' });
        lg.sessions++;
        checkBadges();
        save();
        go('#/session/end');
      }
    },
  },
};
function sessionSummary(p) {
  const t = today(), lg = S.log[t] || { mins: 0, feel: 0, note: '' }, st = streakInfo();
  const doneN = p.blocks.filter(b => p.done[b.id]).length;
  setTimeout(() => confetti(36), 300);
  return `<div class="summary">
    <div class="sum-top"><div class="sum-badge">${icon('trophy')}</div><h1>Session complete</h1><p class="lead">${fmtMins(lg.mins)} today · ${doneN} of ${p.blocks.length} activities</p></div>
    <div class="sum-stats"><div><b>${st.cur}</b><small>day streak</small></div><div><b>${fmtMins(totalMins())}</b><small>all time</small></div><div><b>${LESSONS.filter(l => lessonDone(l.id)).length}</b><small>lessons done</small></div></div>
    <div class="card"><h3>How did it feel?</h3><div class="feel">${[[1, '😣', 'Tough'], [2, '🙂', 'Good'], [3, '🤩', 'Great']].map(([n, e, l]) => `<button type="button" class="chip${lg.feel === n ? ' on' : ''}" data-feel="${n}"><span>${e}</span> ${l}</button>`).join('')}</div>
      <label class="field"><span>Practice note <small class="muted">(optional)</small></span><textarea id="sess-note" rows="2" maxlength="500" placeholder="What went well? What to work on next time?">${esc(lg.note || '')}</textarea></label></div>
    <div class="btn-row"><a class="btn primary" href="#/today">${icon('home')} Back to Today</a></div></div>`;
}
