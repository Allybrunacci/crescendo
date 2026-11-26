/* Crescendo — Songs: your library, and each song's practice page */
'use strict';

const starRow = n => `<span class="stars" aria-label="${n} of 3 stars">${[1, 2, 3].map(i => icon(i <= n ? 'star' : 'star-o', i <= n ? 'on' : '')).join('')}</span>`;
const SONG_TAGS = [['all', 'All'], ['classical', 'Classical'], ['folk', 'Folk'], ['festive', 'Festive'], ['original', 'Originals']];
const TAG_ICON = { classical: 'crown', folk: 'guitar', festive: 'gift', original: 'spark' };
const TAG_NAME = { classical: 'Classical', folk: 'Folk', festive: 'Festive', original: 'Crescendo original' };
const SONGS_UI = { tag: 'all' };
const songCover = s => `<span class="s-cov t-${s.tag || 'folk'}" aria-hidden="true">${icon(TAG_ICON[s.tag] || 'note')}<b>${s.level}</b></span>`;
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
    const pick = s => SONGS_UI.tag === 'all' || s.tag === SONGS_UI.tag;
    const all = SONGS.slice().sort((a, b) => a.level - b.level);
    const open = all.filter(s => lessonDone(s.unlock)), locked = all.filter(s => !lessonDone(s.unlock));
    const shown = open.filter(pick), soon = locked.filter(pick);
    const row = s => {
      const sp = S.songs[s.id] || {};
      return `<a class="song" href="#/songs/${s.id}">${songCover(s)}<span class="s-txt"><b>${esc(s.title)}</b><small>${esc(s.by)} · Level ${s.level}</small></span>${starRow(sp.stars || 0)}</a>`;
    };
    const count = t => SONGS.filter(s => t === 'all' || s.tag === t).length;
    return `<section class="page-head"><h1>Songs</h1><p class="muted">${open.length} of ${SONGS.length} unlocked · ${Object.values(S.songs).filter(x => x.stars >= 3).length} mastered</p></section>
      <div class="chips scroll song-filters" role="group" aria-label="Show">${SONG_TAGS.map(([t, l]) => `<button type="button" class="chip${SONGS_UI.tag === t ? ' on' : ''}" data-act="tag" data-t="${t}" aria-pressed="${SONGS_UI.tag === t}">${l} <span class="muted">${count(t)}</span></button>`).join('')}</div>
      ${shown.length ? `<div class="card list">${shown.map(row).join('')}</div>` : open.length ? `<div class="card empty">${mascot('think')}<p>None of these unlocked yet. They’re coming up below.</p></div>` : `<div class="card empty">${mascot('think')}<p>Your first songs arrive with lesson 1.5. Head to <a href="#/learn">Learn</a> to get there.</p></div>`}
      ${soon.length ? `<h3 class="sec">Coming up</h3><div class="card list dim">${soon.map(s => `<a class="song locked" href="#/songs/${s.id}">${songCover(s)}<span class="s-txt"><b>${esc(s.title)}</b><small>Unlocks with lesson ${lessonNo(LESSON_BY_ID[s.unlock])}</small></span>${icon('lock')}</a>`).join('')}</div>` : ''}
      <p class="small muted center">Stars: ★ play it through, ★★ 85%+ right, ★★★ 95%+ hands together at full speed.</p>
      <p class="fine center">Every song is a public domain melody in Crescendo’s own arrangement, or a Crescendo original.</p>`;
  },
  act: {
    tag: a => { SONGS_UI.tag = a.dataset.t; render(); },
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
