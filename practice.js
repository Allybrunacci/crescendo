/* Crescendo — Practice: pick-your-own drills, plus tools (metronome, piano, chords, scales, circle of fifths, glossary) */
'use strict';

const PRACTICE = [
  { id: 'read', name: 'Note reading', icon: 'eye', about: 'Name notes on the staff', opts: [['Treble', { ranges: [['treble', 'C4', 'C5']] }], ['Bass', { ranges: [['bass', 'C3', 'C4']] }], ['Both', { ranges: [['treble', 'C4', 'G5'], ['bass', 'F2', 'C4']] }], ['Wide range', { ranges: [['treble', 'A3', 'C6'], ['bass', 'C2', 'E4']] }], ['With ♯ ♭', { ranges: [['treble', 'C4', 'C5']], acc: true, flats: true }]], k: 'read', base: { count: 15 } },
  { id: 'play', name: 'Play the note', icon: 'piano', about: 'See a note, play it', opts: [['Treble', { ranges: [['treble', 'C4', 'C5']] }], ['Bass', { ranges: [['bass', 'C3', 'C4']] }], ['Both', { ranges: [['treble', 'C4', 'G5'], ['bass', 'F2', 'C4']] }]], k: 'read', base: { answer: 'keys', count: 15 } },
  { id: 'findkey', name: 'Key finder', icon: 'keys', about: 'Find keys by name', opts: [['White keys', {}], ['Black keys', { letters: ['C#', 'Eb', 'F#', 'Ab', 'Bb'] }], ['All', { letters: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] }]], k: 'findkey', base: { count: 12, middleC: true } },
  { id: 'rhythm', name: 'Rhythm', icon: 'metro', about: 'Read a rhythm and tap it', opts: [['Basics', { level: 1 }], ['With rests', { level: 2 }], ['Quavers', { level: 3 }], ['Dotted', { level: 4 }], ['3/4', { level: 2, time: '3/4' }], ['6/8', { level: 3, time: '6/8' }]], k: 'rhythm', base: { count: 5 } },
  { id: 'beat', name: 'Steady beat', icon: 'metro', about: 'Tap along with a metronome', opts: [['Normal', {}], ['Faster', { faster: true }]], k: 'beat', base: { count: 3 } },
  { id: 'ear', name: 'Ear training', icon: 'ear', about: 'Train your ears', opts: [['High or low', { mode: 'highlow' }], ['Step or skip', { mode: 'stepskip' }], ['Intervals', { mode: 'interval', set: [2, 3, 4, 5, 8] }], ['Major/minor', { mode: 'quality', set: ['', 'm'] }], ['Chord types', { mode: 'quality', set: ['', 'm', 'dim', 'aug'] }], ['Scales', { mode: 'scale' }]], k: 'ear', base: { count: 10 } },
  { id: 'echo', name: 'Echo', icon: 'ear', about: 'Hear a tune, play it back', opts: [['3 notes', { len: 3 }], ['4 notes', { len: 4 }], ['5 notes', { len: 5, notes: 6 }]], k: 'echo', base: { count: 6 } },
  { id: 'chords', name: 'Build chords', icon: 'chord', about: 'Play chords from their names', opts: [['C F G', { chords: ['C', 'F', 'G'] }], ['+ minor', { chords: ['C', 'F', 'G', 'Am', 'Dm', 'Em'] }], ['All majors', { chords: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] }], ['Sevenths', { chords: ['G7', 'C7', 'D7', 'Cmaj7', 'Fmaj7', 'Am7', 'Dm7'] }]], k: 'chordbuild', base: { count: 10 } },
  { id: 'chordname', name: 'Name chords', icon: 'chord', about: 'Read chords on the staff', opts: [['Root position', {}], ['Inversions', { inversions: true }]], k: 'chordname', base: { count: 10, chords: ['C', 'F', 'G', 'Am', 'Dm', 'Em', 'D', 'E', 'A'] } },
  { id: 'intervals', name: 'Intervals', icon: 'scale', about: 'Read intervals on the staff', opts: [['Step/skip', {}], ['Name them', { names: true }]], k: 'intervals', base: { count: 10 } },
  { id: 'keysig', name: 'Key signatures', icon: 'key', about: 'Name the key', opts: [['Up to 2', { keys: ['C', 'G', 'D', 'F', 'Bb'] }], ['Up to 4', { keys: ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb', 'Ab'] }], ['All', { keys: ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'] }]], k: 'keysig', base: { count: 10 } },
  { id: 'values', name: 'Note values', icon: 'note', about: 'How many beats?', opts: [['Basics', { set: ['w', 'h', 'q', 'h.'] }], ['All', { set: ['w', 'h', 'q', 'e', 'h.', 'q.'], rests: true }]], k: 'values', base: { count: 10 } },
];
const TOOLS = [
  { id: 'metronome', name: 'Metronome', icon: 'metro', about: 'Keep steady time' },
  { id: 'piano', name: 'Piano', icon: 'piano', about: 'Play, see note and chord names' },
  { id: 'chordfinder', name: 'Chord finder', icon: 'chord', about: 'Every chord, every shape' },
  { id: 'scales', name: 'Scales', icon: 'scale', about: 'Scales with fingering' },
  { id: 'sight', name: 'Sight-reading', icon: 'eye', about: 'Endless new music to read' },
  { id: 'progressions', name: 'Progressions', icon: 'redo', about: 'Famous chord progressions' },
  { id: 'circle', name: 'Circle of fifths', icon: 'circle', about: 'Keys at a glance' },
  { id: 'glossary', name: 'Glossary', icon: 'book', about: 'Musical words explained' },
];

VIEWS.practice = {
  title: 'Practice',
  stage: p => !!p,
  render(param) {
    if (param) {
      const [id, opt] = param.split(':');
      const d = PRACTICE.find(x => x.id === id), tl = TOOLS.find(x => x.id === id);
      const name = d ? d.name : tl ? tl.name : 'Practice';
      return `<div class="stage-wrap"><header class="st-head"><a class="icon-btn" href="#/practice" aria-label="Back">${icon('chev-l')}</a><h1>${esc(name)}</h1></header>
        ${d ? `<div class="chips scroll" role="tablist">${d.opts.map(([l], i) => `<button type="button" class="chip${(+opt || 0) === i ? ' on' : ''}" data-act="opt" data-i="${i}">${esc(l)}</button>`).join('')}</div>` : ''}
        <div id="pr-host"></div></div>`;
    }
    return `<section class="page-head"><h1>Practice</h1><p class="muted">Extra practice whenever you like. Time spent here counts towards today.</p></section>
      <h3 class="sec">Drills</h3><div class="grid">${PRACTICE.map(d => `<a class="tile" href="#/practice/${d.id}"><span class="t-ico">${icon(d.icon)}</span><b>${esc(d.name)}</b><small>${esc(d.about)}</small></a>`).join('')}</div>
      <h3 class="sec">Tools</h3><div class="grid">${TOOLS.map(d => `<a class="tile tool" href="#/practice/${d.id}"><span class="t-ico">${icon(d.icon)}</span><b>${esc(d.name)}</b><small>${esc(d.about)}</small></a>`).join('')}</div>`;
  },
  after(view, param) {
    if (!param) return null;
    const [id, opt] = param.split(':');
    const host = $('#pr-host', view);
    const d = PRACTICE.find(x => x.id === id);
    trackStart(d ? 'drill' : 'tool', id);
    if (d) {
      const o = d.opts[+opt || 0] || d.opts[0];
      const c = runDrill(host, { k: d.k, ...d.base, ...o[1], title: `${d.name} · ${o[0]}`, doneLabel: 'Back to practice', onExit: () => go('#/practice') }, () => {});
      return () => c.stop();
    }
    const fn = TOOL_RUN[id];
    return fn ? fn(host) : null;
  },
  act: {
    opt(a) { const [id] = UI.param.split(':'); go(`#/practice/${id}:${a.dataset.i}`); },
  },
};

const TOOL_RUN = {
  metronome(host) {
    let bpm = 80, beats = 4, sub = 1, met = null, taps = [];
    const draw = () => {
      host.innerHTML = `<div class="metro">
        <div class="m-dots">${Array.from({ length: beats }, (_, i) => `<i class="${i === 0 ? 'acc' : ''}"></i>`).join('')}</div>
        <div class="m-bpm"><button type="button" class="icon-btn big" data-m="-5" aria-label="Slower">${icon('minus')}</button><div><b>${bpm}</b><small>bpm · ${tempoWord(bpm)}</small></div><button type="button" class="icon-btn big" data-m="5" aria-label="Faster">${icon('plus')}</button></div>
        <input type="range" min="30" max="220" value="${bpm}" aria-label="Tempo" class="m-range">
        <div class="btn-row center"><button type="button" class="btn primary big" data-m="go">${icon(met ? 'stop' : 'play')} ${met ? 'Stop' : 'Start'}</button><button type="button" class="btn ghost" data-m="tap">Tap tempo</button></div>
        <div class="m-opts"><div class="seg sm" aria-label="Beats in a bar">${[2, 3, 4, 6].map(n => `<button type="button" data-beats="${n}" class="${n === beats ? 'on' : ''}">${n}</button>`).join('')}</div>
        <div class="seg sm" aria-label="Subdivision">${[[1, '♩'], [2, '♫'], [3, '3']].map(([n, l]) => `<button type="button" data-sub="${n}" class="${n === sub ? 'on' : ''}">${l}</button>`).join('')}</div></div></div>`;
    };
    const restart = () => { if (met) { met.stop(); start(); } };
    const start = () => {
      met = metronome({ bpm, beats, sub, onBeat: (b, s) => { if (s) return; const ds = $$('.m-dots i', host); ds.forEach((x, i) => x.classList.toggle('on', i === b % beats)); } });
    };
    host.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.m === 'go') { if (met) { met.stop(); met = null; } else start(); draw(); return; }
      if (b.dataset.m === 'tap') {
        const now = performance.now();
        taps = taps.filter(t => now - t < 2500).concat(now);
        if (taps.length >= 3) { const gaps = taps.slice(1).map((t, i) => t - taps[i]); bpm = clamp(Math.round(60000 / (sum(gaps) / gaps.length)), 30, 220); if (met) met.set(bpm); draw(); }
        return;
      }
      if (b.dataset.m) { bpm = clamp(bpm + +b.dataset.m, 30, 220); if (met) met.set(bpm); draw(); }
      if (b.dataset.beats) { beats = +b.dataset.beats; draw(); restart(); }
      if (b.dataset.sub) { sub = +b.dataset.sub; draw(); restart(); }
    });
    host.addEventListener('input', e => { if (e.target.matches('.m-range')) { bpm = +e.target.value; if (met) met.set(bpm); $('.m-bpm b', host).textContent = bpm; $('.m-bpm small', host).textContent = `bpm · ${tempoWord(bpm)}`; } });
    draw();
    return () => { if (met) met.stop(); };
  },
  piano(host) {
    host.innerHTML = `<div class="heard big" aria-live="polite"><span class="h-l">Play something</span><b class="h-n">–</b><small class="h-c"></small></div>
      <div class="btn-row center"><button type="button" class="btn ghost sm" data-o="-12">${icon('chev-l')} Lower</button><button type="button" class="btn ghost sm${AU.sustain ? ' on' : ''}" data-ped>Sustain</button><button type="button" class="btn ghost sm" data-o="12">Higher ${icon('chev-r')}</button></div>
      <div class="kb-host tall"></div><p class="small muted center">On a computer, keys A–K play white notes and W E T Y U play black notes. Z and X change octave.</p>`;
    let from = 48;
    const kb = createKeyboard($('.kb-host', host), { from, to: from + 24, labels: 'c', height: 170 });
    const show = () => {
      const { ms, mic } = playingNow();
      $('.h-n', host).textContent = ms.length ? ms.map(m => playingName(m, mic)).join('  ') : '–';
      const ch = identifyChord(ms);
      $('.h-c', host).textContent = ch.length ? `${pretty(ch[0])} · ${chordName(ch[0].replace(/\/.*/, ''))}` : ms.length === 2 && !mic ? intervalOf(spell(ms[0]), spell(ms[1])).name : '';
    };
    const un = onInput(() => setTimeout(show, 0), true), unc = onChord(() => setTimeout(show, 0));
    host.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.o) { from = clamp(from + +b.dataset.o, 21, 84); kb.setRange(from, from + 24); }
      if ('ped' in b.dataset) { setSustain(!AU.sustain); b.classList.toggle('on', AU.sustain); }
    });
    return () => { un(); unc(); kb.destroy(); setSustain(false); };
  },
  chordfinder(host) {
    let root = 'C', type = '', inv = 0;
    const roots = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    const draw = () => {
      if (host._kb) host._kb.destroy();
      const sym = root + type, ps = chordPitches(sym, 4, inv), w = Math.min(host.clientWidth || 340, 520);
      host.innerHTML = `<div class="chips scroll">${roots.map(r => `<button type="button" class="chip${r === root ? ' on' : ''}" data-root="${r}">${pretty(r)}</button>`).join('')}</div>
        <div class="chips scroll">${Object.entries(CHORD_TYPES).map(([k, v]) => `<button type="button" class="chip${k === type ? ' on' : ''}" data-type="${k}">${esc(k || 'maj')}</button>`).join('')}</div>
        <div class="card cf"><h2>${pretty(sym)}</h2><p class="muted">${esc(chordName(sym))} · ${ps.map(noteLabel).join(' – ')}</p>
        <div class="seg sm">${CHORD_TYPES[type].st.map((_, i) => `<button type="button" data-inv="${i}" class="${i === inv ? 'on' : ''}">${i ? `${i === 1 ? '1st' : i === 2 ? '2nd' : '3rd'} inv.` : 'Root'}</button>`).join('')}</div>
        <div class="staff-host"></div><div class="kb-host"></div><div class="btn-row center"><button type="button" class="btn primary" data-play>${icon('play')} Play</button></div></div>`;
      drawPiece($('.staff-host', host), parsePiece({ music: `[${ps.map(tokOf).join(',')}]w` }), { width: Math.min(220, w), scale: 10, label: sym });
      const kb = createKeyboard($('.kb-host', host), { from: 'C4', to: 'B5', labels: 'c' });
      kb.mark(ps.map(p => p.m), 'target', ps.map(noteLabel));
      host._kb = kb;
      playChord(ps.map(p => p.m), 1.2, 0, 0.6, 0.03);
    };
    host.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.root) { root = b.dataset.root; draw(); }
      else if (b.dataset.type !== undefined) { type = b.dataset.type; inv = 0; draw(); }
      else if (b.dataset.inv !== undefined) { inv = +b.dataset.inv; draw(); }
      else if ('play' in b.dataset) { const ps = chordPitches(root + type, 4, inv); playChord(ps.map(p => p.m), 1.4); setTimeout(() => playSeq(ps.map(p => p.m), 0.3, 0.35), 900); }
    });
    draw();
    return () => { if (host._kb) host._kb.destroy(); };
  },
  scales(host) {
    let tonic = 'C', type = 'major';
    const draw = () => {
      const name = `${tonic} ${type}`, f = fingering(tonic, type);
      host.innerHTML = `<div class="chips scroll">${['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db'].map(r => `<button type="button" class="chip${r === tonic ? ' on' : ''}" data-t="${r}">${pretty(r)}</button>`).join('')}</div>
        <div class="chips scroll">${Object.entries(SCALES).map(([k, v]) => `<button type="button" class="chip${k === type ? ' on' : ''}" data-ty="${k}">${esc(v.name)}</button>`).join('')}</div>
        <div class="card"><h2>${pretty(tonic)} ${esc(SCALES[type].name)}</h2><p class="muted">${scaleNotes(tonic, type, 4).map(noteLabel).join(' ')}</p>
        ${f ? `<p class="small">Fingering going up: right hand <b>${f.rh.join(' ')}</b> · left hand <b>${f.lh.join(' ')}</b></p>` : '<p class="small muted">Use whatever fingering feels comfortable.</p>'}
        <div class="player-host"></div></div>`;
      const pc = ['major', 'minor', 'harmonic', 'melodic'].includes(type) ? scalePiece(`${tonic} ${type}`, 'RL') : (() => {
        const up = scaleNotes(tonic, type, 4), ns = up.concat(up.slice(0, -1).reverse());
        return parsePiece({ music: ns.map(p => `${tokOf(p)}e`).join(' ') + (ns.length % 2 ? ' re' : ''), time: `${Math.ceil(ns.length / 2)}/4` });
      })();
      host._pl = createPlayer($('.player-host', host), pc, { tempo: 80, hands: 'R', level: 4, labels: true, compact: true });
    };
    host.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.t) { if (host._pl) host._pl.destroy(); tonic = b.dataset.t; draw(); }
      if (b.dataset.ty) { if (host._pl) host._pl.destroy(); type = b.dataset.ty; draw(); }
    });
    draw();
    return () => { if (host._pl) host._pl.destroy(); };
  },
  sight(host) {
    let lvl = Math.min(7, curLevel()), pl = null;
    const make = () => {
      if (pl) pl.destroy();
      host.innerHTML = `<div class="chips">${[1, 2, 3, 4, 5, 6, 7].map(n => `<button type="button" class="chip${n === lvl ? ' on' : ''}" data-l="${n}">Level ${n}</button>`).join('')}</div>
        <div class="btn-row"><button type="button" class="btn ghost sm" data-new>${icon('redo')} New piece</button></div><div class="player-host"></div>`;
      pl = createPlayer($('.player-host', host), sightPiece(rng(Date.now()), lvl), { tempo: 66, level: lvl, labels: false, showTempo: true });
    };
    host.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.l) { lvl = +b.dataset.l; make(); } if ('new' in b.dataset) make(); });
    make();
    return () => pl && pl.destroy();
  },
  progressions(host) {
    let id = 'classic', key = 'C', pl = null;
    const keys = ['C', 'G', 'D', 'F', 'Bb', 'Am', 'Em', 'Dm'];
    const make = () => {
      if (pl) pl.destroy();
      const prog = PROGRESSIONS.find(p => p.id === id);
      const k = isMinorKey(prog.key) ? (isMinorKey(key) ? key : relativeKey(key)) : (isMinorKey(key) ? relativeKey(key) : key);
      host.innerHTML = `<div class="chips scroll">${PROGRESSIONS.map(p => `<button type="button" class="chip${p.id === id ? ' on' : ''}" data-p="${p.id}">${esc(p.nick)}</button>`).join('')}</div>
        <div class="chips scroll">${keys.map(x => `<button type="button" class="chip${x === key ? ' on' : ''}" data-k="${x}">${pretty(x)}</button>`).join('')}</div>
        <div class="card"><h2>${esc(prog.nick)}</h2><p class="muted">${esc(prog.romans.map(prettyRoman).join(' – '))} in ${keyName(k)}: <b>${progressionChords(prog, k).map(pretty).join(' – ')}</b></p><p class="small">${esc(prog.about)}</p><div class="player-host"></div></div>`;
      pl = createPlayer($('.player-host', host), progPiece(id, k, 'pulse'), { tempo: 76, level: 5, labels: false, compact: true });
    };
    host.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.p) { id = b.dataset.p; make(); } if (b.dataset.k) { key = b.dataset.k; make(); } });
    make();
    return () => pl && pl.destroy();
  },
  circle(host) {
    let sel = 'C';
    const draw = () => {
      const R = 120, cx = 150, cy = 150;
      const seg = (i, r1, r2) => { const a0 = ((i - 0.5) / 12) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 0.5) / 12) * 2 * Math.PI - Math.PI / 2; const p = (r, a) => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`; return `M${p(r2, a0)}A${r2} ${r2} 0 0 1 ${p(r2, a1)}L${p(r1, a1)}A${r1} ${r1} 0 0 0 ${p(r1, a0)}Z`; };
      const lab = (i, r) => { const a = (i / 12) * 2 * Math.PI - Math.PI / 2; return [(cx + r * Math.cos(a)).toFixed(1), (cy + r * Math.sin(a)).toFixed(1)]; };
      let svg = '';
      FIFTHS.forEach((k, i) => { const [x, y] = lab(i, 102); svg += `<g class="cf-seg${k === sel ? ' on' : ''}" data-k="${k}"><path d="${seg(i, 84, 140)}"/><text x="${x}" y="${y}">${pretty(k)}</text></g>`; });
      FIFTHS_MINOR.forEach((k, i) => { const [x, y] = lab(i, 64); svg += `<g class="cf-seg min${k === sel ? ' on' : ''}" data-k="${k}"><path d="${seg(i, 44, 84)}"/><text x="${x}" y="${y}">${pretty(k)}</text></g>`; });
      const n = KEY_SIGS[sel] || 0, rel = relativeKey(sel);
      host.innerHTML = `<div class="circle-wrap"><svg viewBox="0 0 300 300" class="circle" role="img" aria-label="Circle of fifths">${svg}<circle cx="150" cy="150" r="42" class="cf-mid"/><text x="150" y="155" class="cf-c">${pretty(sel)}</text></svg></div>
        <div class="card"><h2>${keyName(sel)}</h2><p class="muted">${n === 0 ? 'No sharps or flats' : `${plural(Math.abs(n), n > 0 ? 'sharp' : 'flat')}: ${(n > 0 ? SHARP_ORDER : FLAT_ORDER).slice(0, Math.abs(n)).map(L => L + (n > 0 ? '♯' : '♭')).join(' ')}`} · relative ${isMinorKey(sel) ? 'major' : 'minor'}: <b>${rel ? keyName(rel) : '–'}</b></p>
        <div class="keysig-host"></div><h3>Chords in this key</h3><div class="chips">${diatonicChords(sel).map(c => `<button type="button" class="chip" data-play-chord="${c.sym}"><b>${prettyRoman(c.roman)}</b> ${pretty(c.sym)}</button>`).join('')}</div></div>`;
      keyCard($('.keysig-host', host), { key: sel, scale: 10, width: 200 });
    };
    host.addEventListener('click', e => { const g = e.target.closest('.cf-seg'); if (g) { sel = g.dataset.k; draw(); playChord(chordPitches(sel.replace(/m$/, '') + (isMinorKey(sel) ? 'm' : ''), 4).map(p => p.m), 1.2); } });
    draw();
    return null;
  },
  glossary(host) {
    const draw = q => {
      const list = GLOSSARY.filter(([t, d]) => !q || (t + ' ' + d).toLowerCase().includes(q.toLowerCase()));
      $('.gl-list', host).innerHTML = list.length ? list.map(([t, d]) => `<div class="gl-row"><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join('') : '<p class="muted">No matches.</p>';
    };
    host.innerHTML = `<input class="input" type="search" placeholder="Search terms" aria-label="Search the glossary"><div class="card gl-list"></div>
      <h3 class="sec">Practice tips</h3><div class="card">${TIPS.map(([t, d]) => `<div class="gl-row"><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join('')}</div>`;
    $('input', host).addEventListener('input', e => draw(e.target.value));
    draw('');
    return null;
  },
};
const tempoWord = bpm => (bpm < 60 ? 'Largo' : bpm < 76 ? 'Adagio' : bpm < 108 ? 'Andante' : bpm < 120 ? 'Moderato' : bpm < 168 ? 'Allegro' : 'Presto');
