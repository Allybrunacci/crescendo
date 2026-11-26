/* Crescendo — Learn: the course map and the lesson player */
'use strict';

const ART = {
  piano: `<svg viewBox="0 0 240 120" class="art" aria-hidden="true"><rect x="20" y="30" width="200" height="70" rx="10" class="a-body"/><rect x="34" y="58" width="172" height="34" rx="3" class="a-white"/>${Array.from({ length: 14 }, (_, i) => `<path d="M${34 + i * 12.3} 58v34" class="a-line"/>`).join('')}${[0, 1, 3, 4, 5, 7, 8, 10, 11, 12].map(i => `<rect x="${41.5 + i * 12.3}" y="58" width="7.4" height="20" rx="1.5" class="a-black"/>`).join('')}<rect x="20" y="30" width="200" height="16" rx="8" class="a-lid"/><rect x="34" y="53" width="172" height="5" rx="2.5" class="a-feltbar"/></svg>`,
  posture: `<svg viewBox="0 0 240 150" class="art" aria-hidden="true"><path d="M150 128v-40h70v40M150 88h70" class="a-line2"/><rect x="146" y="80" width="78" height="10" rx="3" class="a-white"/><path d="M60 128h44v-38" class="a-line2"/><rect x="52" y="88" width="56" height="9" rx="3" class="a-body"/><circle cx="84" cy="32" r="13" class="a-skin"/><path d="M84 46c-6 12-8 26-6 42h22" class="a-shirt"/><path d="M84 54c14 6 30 12 52 24" class="a-arm"/><path d="M98 88v38M118 126h-20" class="a-leg"/><path d="M136 78l12 4" class="a-arm"/><path d="M188 60l-8 22" class="a-guide"/><text x="182" y="54" class="a-txt">level</text><path d="M126 69h40" class="a-guide"/></svg>`,
  hand: `<svg viewBox="0 0 240 130" class="art" aria-hidden="true"><rect x="10" y="92" width="220" height="30" rx="4" class="a-white"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${10 + i * 27.5} 92v30" class="a-line"/>`).join('')}<path d="M40 60c20-34 120-40 150-6" class="a-skin2"/><path d="M62 64c4 10 4 20 2 28M96 56c4 14 4 26 2 36M128 56c4 14 4 26 2 36M158 62c3 10 3 20 1 30" class="a-finger"/><path d="M44 70c4 8 10 14 16 22" class="a-finger"/><circle cx="114" cy="40" r="22" class="a-ball"/><text x="104" y="45" class="a-txt">ball</text></svg>`,
};

/* ---------- the course map ---------- */
function projection() {
  const weekly = sum(S.week) || 1;
  let cum = 0;
  const t = today();
  return UNITS.map(u => {
    const left = LESSONS.filter(l => l.u === u.n && !lessonDone(l.id));
    cum += sum(left.map(lessonCost));
    const weeks = cum / weekly;
    return { u: u.n, left: left.length, date: left.length ? addDays(t, Math.ceil(weeks * 7)) : null };
  });
}
VIEWS.learn = {
  title: 'Learn',
  stage: p => !!p,
  render(param) {
    if (param && LESSON_BY_ID[param]) return `<div class="stage-wrap"><div id="lesson-host"></div></div>`;
    const nl = nextLesson(), proj = projection();
    const doneN = LESSONS.filter(l => lessonDone(l.id)).length;
    let html = `<section class="page-head"><h1>Learn</h1>${typeof learnTabs === 'function' ? learnTabs('lessons') : ''}<p class="muted">${doneN} of ${LESSONS.length} lessons done${nl ? ` · next up: ${esc(nl.title)}` : ' · course complete!'}</p>
      <div class="bar big"><i style="width:${Math.round((doneN / LESSONS.length) * 100)}%"></i></div></section>`;
    UNITS.forEach((u, ui) => {
      const ls = LESSONS.filter(l => l.u === u.n), d = ls.filter(l => lessonDone(l.id)).length;
      const pr = proj[ui];
      const open = nl ? nl.u === u.n : false;
      html += `<details class="card unit${d === ls.length ? ' complete' : ''}"${open ? ' open' : ''}><summary>
        <span class="u-num">${d === ls.length ? icon('check') : u.n}</span><span class="u-txt"><b>${esc(u.title)}</b><small>${d}/${ls.length} lessons${pr.date && d < ls.length ? ` · around ${fmtShort(pr.date)} at your pace` : ''}</small></span>${icon('chev-d', 'chev')}</summary>
        <p class="u-blurb">${esc(u.blurb)}</p>
        <ol class="lessons">${ls.map(l => {
          const st = S.lessons[l.id] || {};
          const cur = nl && nl.id === l.id;
          return `<li><a class="lesson${st.done ? ' done' : ''}${cur ? ' cur' : ''}" href="#/learn/${l.id}">
            <span class="l-ico">${st.done ? icon('check') : cur ? icon('play') : lessonNo(l)}</span>
            <span class="l-txt"><b>${esc(l.title)}</b><small>${l.mins} min${(l.songs || []).length ? ` · ${plural(l.songs.length, 'new song')}` : ''}${st.at && !st.done ? ' · in progress' : ''}</small></span></a></li>`;
        }).join('')}</ol></details>`;
    });
    html += `<p class="small muted center">Dates allow for practising each lesson before the next one. Change your weekly time in Settings.</p>`;
    return html;
  },
  after(view, param) {
    if (!param || !LESSON_BY_ID[param]) return null;
    const ctl = runLesson($('#lesson-host', view), param, { onExit: () => go('#/learn') });
    trackStart('lesson', param);
    return () => ctl.stop();
  },
};

/* ---------- the lesson player ---------- */
function runLesson(host, id, opts = {}) {
  const l = LESSON_BY_ID[id];
  const st = S.lessons[id] || { done: '', at: 0 };
  let i = st.done ? 0 : Math.min(st.at || 0, l.cards.length - 1);
  let cleanup = null, answered = false;
  host.innerHTML = `<div class="lesson-player${opts.embedded ? ' embedded' : ''}">
    <div class="lp-top">${opts.embedded ? '' : `<button type="button" class="icon-btn" data-lp="exit" aria-label="Close lesson">${icon('close')}</button>`}
      <div class="lp-prog"><div class="bar"><i></i></div><small class="lp-name"></small></div></div>
    <div class="lp-card"></div>
    <div class="lp-foot"><button type="button" class="btn ghost" data-lp="back">${icon('chev-l')} Back</button><button type="button" class="btn primary" data-lp="next">Next ${icon('chev-r')}</button></div></div>`;
  const root = host.firstElementChild, cardEl = $('.lp-card', root);
  function show() {
    if (cleanup) { cleanup(); cleanup = null; }
    hush();
    const c = l.cards[i];
    answered = c.t !== 'quiz';
    $('.lp-prog .bar i', root).style.width = `${Math.round(((i + 1) / (l.cards.length + 1)) * 100)}%`;
    $('.lp-name', root).textContent = `Lesson ${lessonNo(l)} · ${l.title} · ${i + 1} of ${l.cards.length}`;
    cardEl.innerHTML = '';
    cardEl.className = `lp-card t-${c.t}`;
    cleanup = renderCard(cardEl, c, l, () => { answered = true; updateFoot(); });
    updateFoot();
    S.lessons[id] = Object.assign(S.lessons[id] || { done: '' }, { at: i });
    save();
    root.scrollIntoView({ block: 'start' });
    window.scrollTo(0, 0);
  }
  function updateFoot() {
    const nx = $('[data-lp="next"]', root), bk = $('[data-lp="back"]', root);
    bk.disabled = i === 0;
    const c = l.cards[i];
    nx.disabled = !answered;
    nx.innerHTML = i === l.cards.length - 1 ? `${icon('check')} Finish` : c.t === 'drill' && !answered ? `Skip ${icon('chev-r')}` : `Next ${icon('chev-r')}`;
    if (c.t === 'drill') nx.disabled = false;
  }
  function finish() {
    if (cleanup) { cleanup(); cleanup = null; }
    const first = !lessonDone(id);
    S.lessons[id] = { done: S.lessons[id] && S.lessons[id].done ? S.lessons[id].done : today(), at: 0 };
    (l.skills || []).forEach(unlockSkill);
    (l.songs || []).forEach(s => { if (!S.songs[s]) S.songs[s] = { stars: 0, best: 0, plays: 0, last: '', mins: 0 }; });
    checkBadges();
    save();
    const nl = nextLesson();
    const added = (l.skills || []).map(k => SKILLS[k] && SKILLS[k].name).filter(Boolean);
    cardEl.className = 'lp-card t-done';
    cardEl.innerHTML = `<div class="done-card"><div class="mascot-done">${mascot('cheer')}</div><h2>${first ? 'Lesson complete!' : 'Nice refresher!'}</h2><p class="lead">${esc(l.title)}</p>
      ${added.length ? `<div class="added"><b>Now part of your daily practice</b><ul>${added.map(a => `<li>${esc(a)}</li>`).join('')}</ul></div>` : ''}
      ${(l.songs || []).length ? `<div class="added"><b>New in your songs</b><ul>${l.songs.map(s => `<li>${esc(SONG_BY_ID[s].title)}</li>`).join('')}</ul></div>` : ''}</div>`;
    const foot = $('.lp-foot', root);
    foot.innerHTML = opts.embedded ? '' : `<a class="btn ghost" href="#/learn">${icon('list')} All lessons</a>${nl ? `<a class="btn primary" href="#/learn/${nl.id}">Next lesson ${icon('chev-r')}</a>` : ''}`;
    if (first) confetti(30);
    if (opts.onDone) opts.onDone(first);
  }
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-lp]');
    if (!b || b.disabled) return;
    if (b.dataset.lp === 'exit') { if (opts.onExit) opts.onExit(); return; }
    if (b.dataset.lp === 'back' && i > 0) { i--; show(); }
    if (b.dataset.lp === 'next') { if (i < l.cards.length - 1) { i++; show(); } else finish(); }
  });
  show();
  return { stop() { if (cleanup) cleanup(); cleanup = null; hush(); } };
}

// Draws one lesson card. Returns a cleanup function.
function renderCard(el, c, l, onAnswered) {
  delete el.dataset.locked;
  const head = c.h ? `<h2>${rich(c.h)}</h2>` : '';
  const body = c.p ? `<div class="prose">${paras(c.p)}</div>` : '';
  const w = () => Math.min(el.clientWidth || 340, 640);
  if (c.t === 'text' || c.t === 'tip') {
    el.innerHTML = `${c.t === 'tip' ? `<span class="tip-badge">${icon('bulb')} Tip</span>` : ''}${head}${c.art ? `<div class="art-wrap">${ART[c.art] || ''}</div>` : ''}${body}`;
    return null;
  }
  if (c.t === 'hands') {
    el.innerHTML = `${head}<div class="hands-row">${handArt('L')}${handArt('R')}</div>${body}`;
    return null;
  }
  if (c.t === 'kb') {
    el.innerHTML = `${head}${body}<div class="kb-host"></div>`;
    const kb = createKeyboard($('.kb-host', el), { from: c.from || 'C3', to: c.to || 'B4', labels: c.labels || 'c' });
    (c.marks || []).forEach(([n, lab, cls]) => kb.mark(pm(n), cls || 'target', lab || undefined));
    return () => kb.destroy();
  }
  if (c.t === 'staff') {
    el.innerHTML = `${head}<div class="staff-host"></div><div class="btn-row center"><button type="button" class="btn ghost sm" data-play>${icon('play')} Play it</button></div>${body}`;
    const pc = parsePiece({ music: c.music, rh: c.rh, lh: c.lh, clef: c.clef, time: c.time, key: c.key, pickup: c.pickup, hand: c.hand });
    const sc = drawPiece($('.staff-host', el), pc, { width: w(), scale: notationScale(w()) + 0.6, labels: c.labels, label: c.h });
    sc.svg.addEventListener('click', e => { const g = e.target.closest('.ev'); if (!g) return; const ev = sc.staves[+g.dataset.s].events[+g.dataset.i]; if (!ev.rest) playChord(ev.hit ? [72] : eventMidis(ev), 0.9); g.classList.add('on'); setTimeout(() => g.classList.remove('on'), 400); });
    let sched = null;
    $('[data-play]', el).onclick = () => {
      if (sched) sched.stop();
      hush();
      const items = [];
      pc.staves.forEach((sv, s) => sv.events.forEach((ev, i) => { if (!ev.rest && !ev.tied) items.push({ at: ev.t, d: ev.d, ms: ev.hit ? [72] : eventMidis(ev), s, i }); }));
      items.sort((a, b) => a.at - b.at);
      const spb = secPerQ(c.tempo || 84, parseTime(pc.time));
      sched = scheduler(items, spb, { end: pc.len, fn: (t, it) => { playChord(it.ms, Math.max(0.15, it.d * spb * 0.92), t, 0.66); setTimeout(() => { const g = sc.el(it.s, it.i); if (g) { g.classList.add('on'); setTimeout(() => g.classList.remove('on'), Math.max(150, it.d * spb * 900)); } }, Math.max(0, (t - audioNow()) * 1000)); } });
    };
    return () => { if (sched) sched.stop(); };
  }
  if (c.t === 'quiz') {
    el.innerHTML = `<span class="tip-badge q">${icon('help')} Quick question</span>${c.staff ? '<div class="staff-host"></div>' : ''}<h2 class="q">${rich(c.q)}</h2>${choiceButtons(c.opts.map(o => rich(o)))}<div class="dr-fb" role="status"></div>`;
    if (c.staff) { const pc = parsePiece({ music: c.staff, time: c.time || '4/4', clef: c.clef || 'treble', key: c.key }); drawPiece($('.staff-host', el), pc, { width: Math.min(260, w()), scale: 10, label: 'Example' }); }
    $('.choices', el).onclick = e => {
      const b = e.target.closest('[data-c]');
      if (!b || el.dataset.locked) return;
      const k = +b.dataset.c, ok = k === c.ans;
      $$('.choice', el).forEach((x, j) => { x.classList.toggle('ok', j === c.ans && (ok || true)); x.classList.toggle('bad', j === k && !ok); });
      if (ok) el.dataset.locked = '1';
      $('.dr-fb', el).className = 'dr-fb ' + (ok ? 'ok' : 'bad');
      $('.dr-fb', el).innerHTML = ok ? `${icon('check')} ${c.why ? rich(c.why) : 'Correct!'}` : `${icon('x')} Not quite. ${c.why ? rich(c.why) : `It’s ${rich(c.opts[c.ans])}.`}`;
      stat(`quiz:${l.id}`, ok);
      buzz(ok ? 8 : 30);
      onAnswered();
    };
    return null;
  }
  if (c.t === 'drill') {
    el.innerHTML = `${head}${body}<div class="drill-host"></div>`;
    const ctl = runDrill($('.drill-host', el), { ...c.spec, title: c.h, doneLabel: false }, () => onAnswered());
    return () => ctl.stop();
  }
  if (c.t === 'play') {
    let piece, level = l.u, extra = {};
    if (c.song) { const s = SONG_BY_ID[c.song]; piece = pieceOf(s); level = s.level; extra = { tempo: Math.round(s.tempo * 0.85) }; }
    else if (c.scale) { piece = scalePiece(c.scale, c.hand || 'R'); extra = { tempo: 72 }; }
    else piece = parsePiece({ music: c.music, rh: c.rh, lh: c.lh, clef: c.clef, time: c.time, key: c.key, pickup: c.pickup, hand: c.hand, tempo: c.tempo });
    el.innerHTML = `${head}${body}<div class="player-host"></div>`;
    const pl = createPlayer($('.player-host', el), piece, { level, labels: c.labels, tempo: c.tempo || extra.tempo || piece.tempo, compact: true, title: c.h,
      onFinish: r => { if (c.song) recordSong(c.song, r); } });
    return () => pl.destroy();
  }
  if (c.t === 'do') {
    el.innerHTML = `<span class="tip-badge do">${icon('piano')} At your piano</span>${head}<ul class="do-list">${c.steps.map((s, j) => `<li><label><input type="checkbox" data-j="${j}"><span>${rich(s)}</span></label></li>`).join('')}</ul>`;
    return null;
  }
  if (c.t === 'task') {
    el.innerHTML = `<span class="tip-badge task">${icon('pencil')} Away from the piano</span>${head}<ol class="do-list task-list">${c.steps.map((s, j) => `<li><label><input type="checkbox" data-j="${j}"><span>${rich(s)}</span></label></li>`).join('')}</ol>`;
    return null;
  }
  el.innerHTML = head + body;
  return null;
}

// Song progress: plays, best tempo and stars (from a play-along score or your own rating).
function recordSong(id, r) {
  const s = S.songs[id] || (S.songs[id] = { stars: 0, best: 0, plays: 0, last: '', mins: 0 });
  s.plays++;
  s.last = today();
  const song = SONG_BY_ID[id];
  if (r && r.tempo && song) s.best = Math.max(s.best, Math.round((r.tempo / song.tempo) * 100));
  if (r && typeof r.acc === 'number') {
    const both = !song.lh || r.hands === 'RL';
    const pct = r.tempo / song.tempo;
    const stars = r.acc >= 0.95 && both && pct >= 0.95 ? 3 : r.acc >= 0.85 && (both || pct >= 0.9) ? 2 : r.acc >= 0.6 ? 1 : 0;
    s.stars = Math.max(s.stars, stars);
    if (r.acc >= 0.999) award('perfect');
  }
  award('song1');
  checkBadges();
  save();
}
