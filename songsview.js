/* Crescendo — Songs: your library, and each song's practice page */
'use strict';

const starRow = n => `<span class="stars" aria-label="${n} of 3 stars">${[1, 2, 3].map(i => icon(i <= n ? 'star' : 'star-o', i <= n ? 'on' : '')).join('')}</span>`;
VIEWS.songs = {
  title: 'Songs',
  stage: p => !!p,
  render(param) {
    if (param && SONG_BY_ID[param]) {
      const s = SONG_BY_ID[param], sp = S.songs[s.id] || {};
      return `<div class="stage-wrap"><header class="st-head"><a class="icon-btn" href="#/songs" aria-label="Back">${icon('chev-l')}</a>
        <div><h1>${esc(s.title)}</h1><p class="muted small">${esc(s.by)} · ${keyName(s.key)} · ${s.time}</p></div>${starRow(sp.stars || 0)}</header>
        <p class="song-about small">${esc(s.about)}</p>${!lessonDone(s.unlock) ? `<p class="note small">${icon('info')} This song comes with lesson ${lessonNo(LESSON_BY_ID[s.unlock])}: ${esc(LESSON_BY_ID[s.unlock].title)}. You can try it now anyway.</p>` : ''}
        <div id="song-host"></div>
        <div class="song-stats small muted">${sp.plays ? `Played ${plural(sp.plays, 'time')} · best speed ${sp.best || 0}% · ${fmtMins(sp.mins || 0)} practised` : 'Not played yet'}</div></div>`;
    }
    const open = SONGS.filter(s => lessonDone(s.unlock)), locked = SONGS.filter(s => !lessonDone(s.unlock));
    const row = s => {
      const sp = S.songs[s.id] || {};
      return `<a class="song" href="#/songs/${s.id}"><span class="s-lvl">L${s.level}</span><span class="s-txt"><b>${esc(s.title)}</b><small>${esc(s.by)}</small></span>${starRow(sp.stars || 0)}</a>`;
    };
    return `<section class="page-head"><h1>Songs</h1><p class="muted">${open.length} of ${SONGS.length} unlocked · ${Object.values(S.songs).filter(x => x.stars >= 3).length} mastered</p></section>
      ${open.length ? `<div class="card list">${open.map(row).join('')}</div>` : `<div class="card empty"><p>Your first songs arrive with lesson 1.5. Head to <a href="#/learn">Learn</a> to get there.</p></div>`}
      ${locked.length ? `<h3 class="sec">Coming up</h3><div class="card list dim">${locked.map(s => `<a class="song locked" href="#/songs/${s.id}"><span class="s-lvl">L${s.level}</span><span class="s-txt"><b>${esc(s.title)}</b><small>Unlocks with lesson ${lessonNo(LESSON_BY_ID[s.unlock])}</small></span>${icon('lock')}</a>`).join('')}</div>` : ''}
      <p class="small muted center">Stars: ★ play it through, ★★ 85%+ right, ★★★ 95%+ hands together at full speed.</p>`;
  },
  after(view, param) {
    if (!param || !SONG_BY_ID[param]) return null;
    const s = SONG_BY_ID[param], sp = S.songs[s.id] || {};
    const tempo = Math.round(s.tempo * (sp.best >= 95 ? 1 : sp.best ? Math.max(0.6, sp.best / 100 + 0.05) : 0.75));
    const pl = createPlayer($('#song-host', view), pieceOf(s), { level: s.level, tempo, showTempo: false,
      onFinish: res => { recordSong(s.id, res); },
      onRate: n => { const x = S.songs[s.id] || (S.songs[s.id] = { stars: 0, best: 0, plays: 0, last: '', mins: 0 }); x.stars = Math.max(x.stars, n); save(); } });
    trackStart('song', s.id);
    return () => pl.destroy();
  },
};
