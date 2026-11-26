/* Crescendo — the daily plan: turns today's minutes into a balanced practice session, and the Today screen */
'use strict';

const lessonDone = id => !!(S.lessons[id] && S.lessons[id].done);
const nextLesson = () => LESSONS.find(l => !lessonDone(l.id)) || null;
// Unlocked songs in the order their lessons come, so the last one is the newest (the song list isn't in lesson order).
const lessonPos = id => { const i = LESSONS.findIndex(l => l.id === id); return i < 0 ? 1e9 : i; };
const unlockedSongs = () => SONGS.filter(s => lessonDone(s.unlock)).sort((a, b) => lessonPos(a.unlock) - lessonPos(b.unlock));
const skillIds = block => Object.keys(S.skills).filter(k => SKILLS[k] && SKILLS[k].block === block);
const lessonNo = l => `${l.u}.${LESSONS.filter(x => x.u === l.u).indexOf(l) + 1}`;
const curLevel = () => { const n = nextLesson(); return n ? n.u : 9; };

const BLOCK_INFO = {
  warmup: { name: 'Warm-up', icon: 'hand' }, lesson: { name: 'New lesson', icon: 'book' }, read: { name: 'Note reading', icon: 'eye' },
  keys: { name: 'Keyboard map', icon: 'keys' }, rhythm: { name: 'Rhythm', icon: 'metro' }, ear: { name: 'Ear training', icon: 'ear' },
  chords: { name: 'Chords', icon: 'chord' }, scales: { name: 'Scales', icon: 'scale' }, review: { name: 'Quick review', icon: 'redo' },
  sight: { name: 'Sight-reading', icon: 'eye' }, song: { name: 'Song', icon: 'note' }, free: { name: 'Free play', icon: 'spark' },
  study: { name: 'Theory study', icon: 'pencil' }, tdrill: { name: 'Theory drill', icon: 'abc' }, score: { name: 'Song study', icon: 'eye' },
};
const ORDER = ['warmup', 'lesson', 'study', 'keys', 'read', 'rhythm', 'ear', 'chords', 'tdrill', 'scales', 'sight', 'review', 'score', 'song', 'free'];

// The song to focus on: newest one without three stars, else the one played least recently.
function focusSong(list, avoid) {
  const fresh = list.filter(s => (S.songs[s.id] ? S.songs[s.id].stars : 0) < 3 && s.id !== avoid);
  if (fresh.length) return fresh[fresh.length - 1];
  const rest = list.filter(s => s.id !== avoid);
  return rest.sort((a, b) => ((S.songs[a.id] || {}).last || '').localeCompare((S.songs[b.id] || {}).last || ''))[0] || null;
}
const dueCount = block => skillIds(block).filter(k => S.skills[k].due <= today()).length;

// Practice minutes needed after a lesson before the plan offers the next one (more in later units).
const CONSOLIDATE = u => [0, 0, 25, 35, 60, 75, 90, 100, 100][u] || 100;
const lessonCost = l => l.mins + Math.max(CONSOLIDATE(l.u), l.mins * 1.5);
function lessonReady(nl) {
  const prev = LESSONS[LESSONS.indexOf(nl) - 1];
  if (!prev || !lessonDone(prev.id) || nl.u <= 1) return true;
  const since = S.lessons[prev.id].done;
  if (!since || since > today()) return true;
  let mins = 0;
  for (let d = since; d <= today(); d = addDays(d, 1)) mins += minsOn(d);
  return mins >= CONSOLIDATE(nl.u) || daysBetween(since, today()) >= (nl.u <= 3 ? 4 : 6);
}
function candidates(d, M) {
  const r = rng(`plan:${d}`);
  const day = daysBetween(S.created, d);
  const out = [];
  const add = (k, w, min, max, pri, ref, sub) => out.push({ k, w, min, max, pri: pri + (r() - 0.5) * 0.4, ref, sub });
  const nl = nextLesson();
  const ready = nl && lessonReady(nl);
  if (nl && ready) {
    add('lesson', 3.2, Math.min(nl.mins, 6, Math.max(3, M - 2)), nl.mins + 3, 1, nl.id);
    // Unit 1 lessons are short: on a longer day, take the next one too.
    const nl2 = LESSONS[LESSONS.indexOf(nl) + 1];
    if (nl.u === 1 && nl2 && nl2.u === 1 && M >= nl.mins + nl2.mins + 2) add('lesson', 3, nl2.mins, nl2.mins + 2, 1.5, nl2.id);
  }
  const songs = unlockedSongs();
  if (songs.length) {
    const f = focusSong(songs);
    if (f) add('song', 3, 3, 15, 2, f.id);
    if (M >= 35 && songs.length > 2) { const g = focusSong(songs.slice(0, -1).filter(s => (S.songs[s.id] || {}).stars >= 1), f && f.id); if (g) add('song', 1.2, 3, 8, 7.5, g.id); }
  }
  const warm = [...new Set([].concat(...Object.keys(S.skills).map(k => (SKILLS[k] && SKILLS[k].warm) || [])))];
  if (warm.length) add('warmup', 1, 2, 5, M >= 10 ? 3 : 9, warm[day % warm.length]);
  const rot = k => ((day + ['rhythm', 'ear', 'review', 'sight', 'scales'].indexOf(k)) % 3) * 0.6;
  if (skillIds('read').length) add('read', 2, 2, 8, 4 - (dueCount('read') ? 0.5 : 0));
  else if (skillIds('keys').length) add('keys', 1.5, 2, 5, 4);
  if (skillIds('chords').length) {
    const progs = skillIds('chords').map(k => SKILLS[k].prog).filter(Boolean);
    add('chords', 2, 3, 10, 5 - (dueCount('chords') ? 0.5 : 0), progs.length && r() < 0.6 ? progs[day % progs.length] : '');
  }
  const scales = skillIds('scales').map(k => SKILLS[k].scale);
  if (scales.length) add('scales', 1.5, 2, 6, 5 + rot('scales'), scales[day % scales.length]);
  if (skillIds('rhythm').length) add('rhythm', 1, 2, 5, 5.5 + rot('rhythm') - (dueCount('rhythm') ? 0.6 : 0));
  const ears = skillIds('ear');
  if (ears.length) add('ear', 1, 2, 5, 5.5 + rot('ear') - (dueCount('ear') ? 0.6 : 0), ears[day % ears.length]);
  if (hasSkill('sight') || hasSkill('treble2')) add('sight', 1.2, 2, 6, 6 + rot('sight'));
  if (reviewQuestions().length >= 3 && dueCount('review')) add('review', 1, 2, 4, 6.5 + rot('review'));
  if (M >= 40 || hasSkill('improv') || !Object.keys(S.skills).length) add('free', 0.6, 2, 10, M >= 40 ? 8 : 9.5);
  if (!out.length) add('free', 1, 1, 60, 1);
  return out.sort((a, b) => a.pri - b.pri);
}

// Picks blocks that fit in M minutes, then shares out the spare time by weight. Away days use theory blocks only.
function buildPlan(d, M, away) {
  if (M <= 0) return { m: 0, blocks: [], done: {}, v: 2, away: !!away };
  const cands = away ? awayCandidates(d, M) : candidates(d, M);
  const chosen = [];
  let used = 0;
  for (const c of cands) {
    if (used + c.min <= M) { chosen.push({ ...c, mins: c.min }); used += c.min; }
  }
  if (!chosen.length) chosen.push({ ...cands[0], mins: M, min: 1, max: M });
  let spare = M - sum(chosen.map(c => c.mins));
  for (let guard = 0; spare > 1e-6 && guard < 20; guard++) {
    const open = chosen.filter(c => c.mins < c.max - 1e-6);
    if (!open.length) { chosen[0].mins += spare; spare = 0; break; }
    const tw = sum(open.map(c => c.w));
    let given = 0;
    open.forEach(c => { const g = Math.min(c.max - c.mins, (spare * c.w) / tw); c.mins += g; given += g; });
    spare -= given;
  }
  // Whole minutes that still add up to M.
  const floors = chosen.map(c => Math.max(1, Math.floor(c.mins)));
  let diff = M - sum(floors);
  const byFrac = chosen.map((c, i) => [c.mins - Math.floor(c.mins), i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; diff > 0; k = (k + 1) % byFrac.length, diff--) floors[byFrac[k][1]]++;
  for (let k = byFrac.length - 1; diff < 0; k = (k - 1 + byFrac.length) % byFrac.length) if (floors[byFrac[k][1]] > 1) { floors[byFrac[k][1]]--; diff++; }
  const blocks = chosen.map((c, i) => ({ id: `${c.k}${i}`, k: c.k, ref: c.ref || '', mins: floors[i] }))
    .sort((a, b) => ORDER.indexOf(a.k) - ORDER.indexOf(b.k) || a.id.localeCompare(b.id));
  return { m: M, blocks, done: {}, v: 2, away: !!away };
}
// Today's plan stays put through the day; it's rebuilt if the minutes change. At the piano and away have a plan each.
function planFor(d) {
  const M = plannedFor(d), away = isAway(d), store = away ? S.aplans : S.plans;
  let p = store[d];
  if (!p || p.m !== M || p.v !== 2) {
    const done = p ? p.done : {};
    p = buildPlan(d, M, away);
    p.blocks.forEach(b => { if (done[b.id]) p.done[b.id] = done[b.id]; });
    store[d] = p;
  }
  p.blocks.forEach(b => { if (b.k === 'lesson' && lessonDone(b.ref) && !p.done[b.id]) p.done[b.id] = 1; });
  return p;
}
function blockTitle(b) {
  const bi = BLOCK_INFO[b.k];
  if (b.k === 'lesson') { const l = LESSON_BY_ID[b.ref]; return l ? { t: `Lesson ${lessonNo(l)}: ${l.title}`, s: UNITS[l.u - 1].title } : { t: bi.name, s: '' }; }
  if (b.k === 'song') { const s = SONG_BY_ID[b.ref]; return { t: s ? s.title : 'Song', s: s ? `Song · ${s.by}` : '' }; }
  if (b.k === 'warmup') { const w = WARMUPS[b.ref]; return { t: 'Warm-up', s: w ? w.name : '' }; }
  if (b.k === 'scales') return { t: 'Scales', s: b.ref };
  if (b.k === 'chords') { const p = PROGRESSIONS.find(x => x.id === b.ref); return { t: 'Chords', s: p ? `${p.nick}: ${p.name}` : 'Build chords' }; }
  if (b.k === 'ear') { const sk = SKILLS[b.ref]; return { t: 'Ear training', s: sk ? sk.name : 'High or low' }; }
  if (b.k === 'read') return { t: 'Note reading', s: readRanges().map(([c, a, z]) => `${cap(c)} ${pretty(a.replace(/\d/, ''))}–${pretty(z.replace(/\d/, ''))}`).join(', ') };
  if (b.k === 'rhythm') return { t: 'Rhythm', s: hasSkill('rhythm1') ? 'Read and tap' : 'Feel the beat' };
  if (b.k === 'free') return { t: 'Free play', s: hasSkill('improv') ? 'Improvise' : 'Explore and enjoy' };
  if (b.k === 'study') { const st = typeof STUDY_BY_ID !== 'undefined' && STUDY_BY_ID[b.ref]; return st ? { t: T(st.title), s: `Theory ${studyNo(st)}${studyDone(st.id) ? ' · refresher' : ''}` } : { t: bi.name, s: '' }; }
  if (b.k === 'tdrill') { const td = THEORY_DRILLS[b.ref]; return { t: 'Theory drill', s: td ? td.name : '' }; }
  if (b.k === 'score') { const s = SONG_BY_ID[b.ref]; return { t: 'Song study', s: s ? `${s.title} · learn it in your head` : '' }; }
  return { t: bi.name, s: '' };
}
function readRanges() {
  const out = {};
  skillIds('read').forEach(k => {
    const rd = SKILLS[k].read;
    if (!rd) return;
    const [c, a, z] = rd;
    if (!out[c]) out[c] = [c, a, z];
    else { if (pm(a) < pm(out[c][1])) out[c][1] = a; if (pm(z) > pm(out[c][2])) out[c][2] = z; }
  });
  const list = Object.values(out);
  return list.length ? list : [['treble', 'C4', 'G4']];
}
function reviewQuestions() {
  const qs = [];
  LESSONS.forEach(l => { if (lessonDone(l.id)) l.cards.forEach(c => { if (c.t === 'quiz') qs.push(c); }); });
  if (typeof STUDIES !== 'undefined') STUDIES.forEach(st => { if (studyDone(st.id)) st.cards.forEach(c => { if (c.t === 'quiz') qs.push(c); }); });
  return qs;
}

/* ---------- streaks ---------- */
const dayCounts = d => minsOn(d) >= Math.min(5, Math.max(1, plannedFor(d)));
function streakInfo() {
  const t = today();
  let cur = 0, d = dayCounts(t) ? t : addDays(t, -1);
  for (let i = 0; i < 2000 && d >= S.created; i++, d = addDays(d, -1)) {
    if (dayCounts(d)) cur++;
    else if (plannedFor(d) === 0) continue;
    else break;
  }
  let best = cur, run = 0;
  for (let k = S.created, i = 0; k <= t && i < 4000; k = addDays(k, 1), i++) {
    if (dayCounts(k)) { run++; best = Math.max(best, run); } else if (plannedFor(k) !== 0 && k !== t) run = 0;
  }
  return { cur, best };
}
const totalMins = () => sum(Object.values(S.log).map(l => l.mins));
function checkBadges() {
  const st = streakInfo().cur, tm = totalMins();
  if (Object.values(S.log).some(l => l.sessions > 0)) award('first');
  if (Object.values(S.lessons).some(l => l.done)) award('lesson1');
  if (st >= 3) award('streak3');
  if (st >= 7) award('streak7');
  if (st >= 30) award('streak30');
  if (tm >= 60) award('hour1');
  if (tm >= 600) award('hour10');
  UNITS.forEach(u => { if (LESSONS.filter(l => l.u === u.n).every(l => lessonDone(l.id))) award(`unit${u.n}`); });
  if (Object.values(S.songs).filter(s => s.stars >= 3).length >= 5) award('songs5');
  const read = Object.entries(S.stats).filter(([k]) => k.startsWith('nt:')).reduce((a, [, v]) => a + v[1], 0);
  if (read >= 50) award('reader50');
  const th = typeof studiesDone === 'function' ? studiesDone() : 0;
  if (th >= 5) award('theory5');
  if (th >= 20) award('theory20');
}
let lastLogSave = 0;
function onPracticeTime() { if (Date.now() - lastLogSave > 20000) { lastLogSave = Date.now(); checkBadges(); } }

/* ---------- Today ---------- */
function greeting() {
  const h = new Date().getHours();
  const g = h < 5 ? 'Late-night practice' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return S.name ? `${g}, ${esc(S.name)}` : g;
}
function ring(pct, size = 92) {
  const r = 40, c = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><circle cx="50" cy="50" r="${r}" class="ring-bg"/><circle cx="50" cy="50" r="${r}" class="ring-fg" stroke-dasharray="${(c * Math.min(1, pct)).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 50 50)"/></svg>`;
}
const MIN_CHOICES = [0, 5, 10, 15, 20, 25, 30, 40, 45, 60, 75, 90];
function weekStrip() {
  const t = today(), ws = weekStartOf(t);
  const maxM = Math.max(10, ...Array.from({ length: 7 }, (_, i) => Math.max(plannedFor(addDays(ws, i)), minsOn(addDays(ws, i)))));
  return `<div class="week">${Array.from({ length: 7 }, (_, i) => {
    const d = addDays(ws, i), pl = plannedFor(d), dn = minsOn(d), fut = d > t;
    const h1 = Math.round((pl / maxM) * 100), h2 = Math.round((Math.min(dn, maxM) / maxM) * 100);
    return `<div class="wd${d === t ? ' today' : ''}${fut ? ' fut' : ''}${dayCounts(d) ? ' hit' : ''}" title="${fmtDay(d)}: ${fmtMins(dn)} of ${fmtMins(pl)}">
      <div class="bars"><i class="pl" style="height:${h1}%"></i><i class="dn" style="height:${h2}%"></i></div><span>${WD[dowOf(d)][0]}</span></div>`;
  }).join('')}</div>`;
}
VIEWS.today = {
  title: 'Today',
  render() {
    const t = today(), p = planFor(t), M = p.m, done = minsOn(t), away = !!p.away;
    const st = streakInfo();
    const nl = nextLesson();
    const left = p.blocks.filter(b => !p.done[b.id]);
    const allDone = p.blocks.length && !left.length;
    const tip = TIPS[daysBetween('2026-01-01', t) % TIPS.length];
    let html = `<section class="hello"><div><p class="eyebrow">${fmtDay(t)}</p><h1>${greeting()}</h1></div>
      <div class="streak${st.cur ? ' on' : ''}" title="Best: ${st.best} days">${icon('flame')}<b>${st.cur}</b><small>day${st.cur === 1 ? '' : 's'}</small></div></section>
      <div class="seg where" role="radiogroup" aria-label="Where are you practising today?">${[['piano', 'piano', 'At the piano'], ['away', 'pencil', 'Away from the piano']].map(([k, ic, l]) => `<button type="button" role="radio" aria-checked="${away === (k === 'away')}" class="${away === (k === 'away') ? 'on' : ''}" data-act="where" data-v="${k}">${icon(ic)}<span>${l}</span></button>`).join('')}</div>`;
    if (!M) {
      html += `<section class="card hero rest"><span class="mascot-rest">${mascot('sleep')}</span><div><h2>Rest day</h2><p>No practice planned today. Rest helps your brain lock in what you’ve learned.</p>
        <p class="small">Fancy a quick one anyway?</p><div class="chips">${[5, 10, 15, 20].map(m => `<button type="button" class="chip" data-act="mins" data-m="${m}">${m} min</button>`).join('')}</div></div></section>`;
    } else {
      const pct = Math.min(1, done / M);
      html += `<section class="card hero${away ? ' away' : ''}"><div class="hero-ring">${ring(pct)}<div class="hero-num"><b>${Math.floor(done)}</b><small>of ${M} min</small></div></div>
        <div class="hero-txt"><h2>${allDone ? 'Practice done!' : done > 0.5 ? 'Keep going' : away ? 'Theory practice' : 'Today’s practice'}</h2>
        <p>${allDone ? (away ? 'Brilliant. Back at the piano later? Switch to <b>At the piano</b> for some playing.' : 'Brilliant work. Anything extra is a bonus.') : `${plural(p.blocks.length, 'activity', 'activities')} · ${fmtMins(M)}${away ? ' · no piano needed' : ''}`}</p>
        <div class="btn-row"><button type="button" class="btn primary" data-act="start">${icon(allDone ? 'redo' : 'play')} ${allDone ? 'Practise more' : done > 0.5 ? 'Continue' : 'Start'}</button>
        <button type="button" class="btn ghost sm" data-act="change">${icon('clock')} ${M} min</button></div></div></section>`;
      if (away && !allDone && p.blocks.some(b => ['ear', 'tdrill', 'score'].includes(b.k))) html += `<p class="small muted away-note">${icon('headphones')} Some parts play sounds, so headphones help if you’re out and about.</p>`;
      html += `<section class="plan"><h3 class="sec">Your plan</h3><ol class="blocks">${p.blocks.map((b, i) => {
        const tt = blockTitle(b), ok = !!p.done[b.id];
        return `<li><button type="button" class="block${ok ? ' done' : ''}" data-act="block" data-i="${i}">
          <span class="bk-ico k-${b.k}">${icon(ok ? 'check' : BLOCK_INFO[b.k].icon)}</span>
          <span class="bk-txt"><b>${esc(tt.t)}</b><small>${esc(tt.s)}</small></span><span class="bk-min">${b.mins} min</span></button></li>`;
      }).join('')}</ol></section>`;
    }
    html += `<section class="card"><div class="row-head"><h3>This week</h3><span class="small muted">${fmtMins(sum(Array.from({ length: 7 }, (_, i) => minsOn(addDays(weekStartOf(t), i)))))} of ${fmtMins(sum(Array.from({ length: 7 }, (_, i) => plannedFor(addDays(weekStartOf(t), i)))))}</span></div>${weekStrip()}</section>`;
    const ns = away && typeof nextStudy === 'function' ? nextStudy() : null;
    if (ns) {
      const inUnit = STUDIES.filter(s => s.u === ns.u), doneIn = inUnit.filter(s => studyDone(s.id)).length;
      html += `<a class="card next-lesson" href="#/theory/${ns.id}"><div><p class="eyebrow">Up next in theory · Unit ${ns.u}: ${esc(UNITS[ns.u - 1].title)}</p><h3>${esc(T(ns.title))}</h3>
        <div class="bar"><i style="width:${Math.round((doneIn / inUnit.length) * 100)}%"></i></div><p class="small muted">${doneIn} of ${inUnit.length} theory studies in this unit · ${ns.mins} min</p></div>${icon('chev-r')}</a>`;
    } else if (nl) {
      const u = UNITS[nl.u - 1], inUnit = LESSONS.filter(l => l.u === nl.u), doneIn = inUnit.filter(l => lessonDone(l.id)).length;
      html += `<a class="card next-lesson" href="#/learn/${nl.id}"><div><p class="eyebrow">Up next · Unit ${u.n}: ${esc(u.title)}</p><h3>${esc(nl.title)}</h3>
        <div class="bar"><i style="width:${Math.round((doneIn / inUnit.length) * 100)}%"></i></div><p class="small muted">${doneIn} of ${inUnit.length} lessons in this unit${lessonReady(nl) ? '' : ' · it joins your plan after a little more practice, or start it now'}</p></div>${icon('chev-r')}</a>`;
    }
    html += `<section class="card tip"><span class="tip-mascot">${mascot('wave')}</span><div><span class="who">Quaver says</span><b>${esc(tip[0])}</b><p>${esc(tip[1])}</p></div></section>`;
    return html;
  },
  act: {
    start() {
      const p = planFor(today());
      const i = p.blocks.findIndex(b => !p.done[b.id]);
      go(`#/session/${i < 0 ? 0 : i}`);
    },
    block(a) { go(`#/session/${a.dataset.i}`); },
    change() { openMinutesSheet(today()); },
    mins(a) { S.over[today()] = +a.dataset.m; save(); render(); },
    where(a) {
      const away = a.dataset.v === 'away';
      if (isAway(today()) === away) return;
      setAway(today(), away);
      render();
      toast(away ? `${icon('pencil')} Today’s plan is theory you can do anywhere` : `${icon('piano')} Today’s plan is back at the piano`);
    },
  },
};
function openMinutesSheet(d) {
  const cur = plannedFor(d);
  openSheet(`${sheetHead('Practice time today', fmtDay(d))}
    <p class="lead">Your plan rebuilds around the time you choose. Your weekly schedule is in Settings.</p>
    <div class="chips big">${MIN_CHOICES.map(m => `<button type="button" class="chip${m === cur ? ' on' : ''}" data-act="pick" data-m="${m}">${m ? `${m} min` : 'Rest'}</button>`).join('')}</div>
    ${d in S.over ? `<div class="btn-row"><button type="button" class="btn ghost" data-act="reset">Back to my usual ${S.week[dowOf(d)]} min</button></div>` : ''}`, {
    label: 'Practice time today',
    act: {
      pick(a, e, sh) { S.over[d] = +a.dataset.m; if (S.over[d] === S.week[dowOf(d)]) delete S.over[d]; save(); sh.close(); render(); toast(`Today’s plan: ${S.over[d] === 0 ? 'rest day' : fmtMins(plannedFor(d))}`); },
      reset(a, e, sh) { delete S.over[d]; save(); sh.close(); render(); },
    },
  });
}
