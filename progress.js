/* Crescendo — Progress: streaks, time, reading accuracy on the staff, skills, badges and your practice journal */
'use strict';

function heatmap() {
  const t = today(), weeks = 16, start = addDays(weekStartOf(t), -7 * (weeks - 1));
  let cells = '';
  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(start, i);
    if (d > t) { cells += '<i class="fut"></i>'; continue; }
    const m = minsOn(d), pl = plannedFor(d);
    const lv = !m ? 0 : m < pl * 0.5 ? 1 : m < pl ? 2 : 3;
    cells += `<i class="l${lv}${d < S.created ? ' pre' : ''}" title="${fmtDay(d)}: ${fmtMins(m)}"></i>`;
  }
  const labels = [];
  for (let c = 0; c < weeks; c++) { const d = fromKey(addDays(start, c * 7)); labels.push(d.getDate() <= 7 ? MON[d.getMonth()] : ''); }
  return `<div class="heat">${cells}</div><div class="heat-m">${labels.map(l => `<span>${l}</span>`).join('')}</div>
    <div class="heat-key small muted">Less <i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i> Goal met</div>`;
}
function weeksChart() {
  const t = today(), ws = weekStartOf(t);
  const rows = Array.from({ length: 8 }, (_, k) => {
    const s = addDays(ws, -7 * (7 - k));
    return { s, m: sum(Array.from({ length: 7 }, (_, i) => minsOn(addDays(s, i)))), p: sum(Array.from({ length: 7 }, (_, i) => plannedFor(addDays(s, i)))) };
  });
  const top = Math.max(30, ...rows.map(r => Math.max(r.m, r.p)));
  const W = 320, H = 130, bw = W / 8;
  const bars = rows.map((r, i) => {
    const h = (r.m / top) * (H - 26), hp = (r.p / top) * (H - 26);
    return `<rect x="${(i * bw + 8).toFixed(1)}" y="${(H - 18 - hp).toFixed(1)}" width="${(bw - 16).toFixed(1)}" height="${hp.toFixed(1)}" rx="5" class="wc-p"/>
      <rect x="${(i * bw + 8).toFixed(1)}" y="${(H - 18 - h).toFixed(1)}" width="${(bw - 16).toFixed(1)}" height="${Math.max(h, r.m ? 2 : 0).toFixed(1)}" rx="5" class="wc-d"/>
      <text x="${(i * bw + bw / 2).toFixed(1)}" y="${H - 4}" class="wc-l">${fmtShort(r.s).split(' ')[0]}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="wchart" role="img" aria-label="Minutes practised per week">${bars}</svg>
    <p class="small muted">Minutes per week for the last 8 weeks (faint bars show your plan).</p>`;
}
// Every natural note in the learned range, coloured by how well you read it.
function readingMap(host) {
  const rows = [['treble', 'C4', 'C6'], ['bass', 'C2', 'C4']];
  host.innerHTML = rows.map((_, i) => `<div class="rm" data-i="${i}"></div>`).join('');
  rows.forEach(([clef, a, z], i) => {
    const ns = [];
    for (let m = pm(a); m <= pm(z); m++) if (!isBlack(m)) ns.push(m);
    const music = ns.map(m => `${tokOf(spell(m))}q`).join(' ');
    const pc = parseMusic(music, { loose: true });
    const w = Math.max(300, host.clientWidth || 320);
    const sc = engrave($(`.rm[data-i="${i}"]`, host), { staves: [{ clef, events: pc.events }], time: null, width: w, scale: w < 420 ? 6.2 : 7.5, bars: [{ start: 0, len: pc.len }], final: false, maxBars: 1, label: `${clef} clef reading accuracy` });
    ns.forEach((m, j) => {
      const s = S.stats[`nt:${clef}:${m}`];
      const acc = s && s[0] ? s[1] / s[0] : null;
      sc.mark(0, j, acc === null ? 'na' : acc >= 0.9 ? 'good' : acc >= 0.7 ? 'okay' : 'weak');
      const g = sc.el(0, j);
      if (g) { const tt = document.createElementNS('http://www.w3.org/2000/svg', 'title'); tt.textContent = `${noteFull(spell(m))}: ${acc === null ? 'not tried yet' : `${Math.round(acc * 100)}% of ${s[0]}`}`; g.append(tt); }
    });
  });
}
VIEWS.progress = {
  title: 'Progress',
  render() {
    const st = streakInfo(), tm = totalMins();
    const lessons = LESSONS.filter(l => lessonDone(l.id)).length;
    const mastered = Object.values(S.songs).filter(x => x.stars >= 3).length;
    const sks = Object.keys(S.skills).filter(k => SKILLS[k]);
    const notes = Object.entries(S.log).filter(([, l]) => l.note || l.feel).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
    const ear = Object.entries(S.stats).filter(([k]) => k.startsWith('ear:'));
    const earAcc = ear.length ? Math.round((sum(ear.map(([, v]) => v[1])) / Math.max(1, sum(ear.map(([, v]) => v[0])))) * 100) : null;
    const rh = Object.entries(S.stats).filter(([k]) => k.startsWith('rh:'));
    const rhAcc = rh.length ? Math.round((sum(rh.map(([, v]) => v[1])) / Math.max(1, sum(rh.map(([, v]) => v[0])))) * 100) : null;
    const rd = Object.entries(S.stats).filter(([k]) => k.startsWith('nt:'));
    const rdAcc = rd.length ? Math.round((sum(rd.map(([, v]) => v[1])) / Math.max(1, sum(rd.map(([, v]) => v[0])))) * 100) : null;
    return `<section class="page-head"><h1>Progress</h1><p class="muted">Practising since ${fmtDay(S.created)}</p></section>
      <div class="stat-grid">
        <div class="card stat"><span>${icon('flame')}</span><b>${st.cur}</b><small>day streak · best ${st.best}</small></div>
        <div class="card stat"><span>${icon('clock')}</span><b>${fmtMins(tm)}</b><small>practised in total</small></div>
        <div class="card stat"><span>${icon('book')}</span><b>${lessons}<i>/${LESSONS.length}</i></b><small>lessons done</small></div>
        <div class="card stat"><span>${icon('star')}</span><b>${mastered}<i>/${SONGS.length}</i></b><small>songs mastered</small></div></div>
      <section class="card"><h3>Practice calendar</h3>${heatmap()}</section>
      <section class="card"><h3>Weekly time</h3>${weeksChart()}</section>
      <section class="card"><h3>Reading</h3><p class="small muted">Each note coloured by how often you name it correctly${rdAcc !== null ? ` (${rdAcc}% overall)` : ''}. <span class="lg good">●</span> 90%+ <span class="lg okay">●</span> 70%+ <span class="lg weak">●</span> needs work</p><div class="reading-map"></div></section>
      <section class="card"><h3>Ears and rhythm</h3><div class="mini-stats"><div><b>${earAcc === null ? '–' : earAcc + '%'}</b><small>ear training</small></div><div><b>${rhAcc === null ? '–' : rhAcc + '%'}</b><small>rhythms in time</small></div><div><b>${Object.values(S.songs).reduce((a, s) => a + s.plays, 0)}</b><small>song plays</small></div></div></section>
      <section class="card"><h3>Skills</h3>${sks.length ? `<div class="skills">${sks.map(k => { const sk = S.skills[k]; return `<div class="sk"><span>${esc(SKILLS[k].name)}</span><span class="lvl" aria-label="Level ${sk.lvl} of 6">${Array.from({ length: 6 }, (_, i) => `<i class="${i < sk.lvl ? 'on' : ''}"></i>`).join('')}</span><small>${sk.due <= today() ? 'review due' : `next ${fmtShort(sk.due)}`}</small></div>`; }).join('')}</div>` : '<p class="muted">Finish your first lesson to start building skills.</p>'}</section>
      <section class="card"><h3>Badges</h3><div class="badges">${BADGES.map(b => `<div class="bdg${S.badges[b.id] ? ' got' : ''}" title="${esc(b.about)}"><span>${b.e}</span><b>${esc(b.name)}</b><small>${S.badges[b.id] ? fmtShort(S.badges[b.id]) : esc(b.about)}</small></div>`).join('')}</div></section>
      ${notes.length ? `<section class="card"><h3>Practice journal</h3>${notes.map(([d, l]) => `<div class="jr"><b>${fmtDay(d)}</b> ${['', '😣', '🙂', '🤩'][l.feel] || ''} <span class="muted small">${fmtMins(l.mins)}</span>${l.note ? `<p>${esc(l.note)}</p>` : ''}</div>`).join('')}</section>` : ''}`;
  },
  after(view) { readingMap($('.reading-map', view)); return null; },
};
