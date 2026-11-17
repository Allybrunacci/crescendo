/* Crescendo — the score player: listen, play along at your own pace (“wait for me”), or play in time */
'use strict';

const notationScale = w => (w < 380 ? 7.4 : w < 520 ? 8 : 9) * (S.prefs.size || 1);
function showLabels(level) {
  if (S.prefs.labels === 'always') return true;
  if (S.prefs.labels === 'never') return false;
  return (level || 1) <= 1 && !(S.lessons.u2l2 && S.lessons.u2l2.done);
}
const INPUT_HINT = () => (S.prefs.input === 'midi' && IN.midi.status === 'on' ? 'Play it on your keyboard' : S.prefs.input === 'mic' && (IN.mic.on || MIC.pending) ? 'Play it on your piano — I’m listening' : 'Play it on your piano, or tap the keys below');

function createPlayer(host, piece, opts = {}) {
  const st = {
    hands: opts.hands || (piece.staves.length > 1 ? 'RL' : piece.staves[0].hand),
    tempo: opts.tempo || piece.tempo || 80,
    mode: null, k: 0, wrong: 0, got: new Set(), started: 0, metro: true,
    labels: opts.labels !== undefined ? opts.labels : showLabels(opts.level),
  };
  const two = piece.staves.length > 1;
  host.innerHTML = `<div class="player${opts.compact ? ' compact' : ''}">
    <div class="pl-top">
      ${two && opts.handsPick !== false ? `<div class="seg sm hands" role="radiogroup" aria-label="Hands">${[['R', 'Right'], ['L', 'Left'], ['RL', 'Both']].map(([h, l]) => `<button type="button" role="radio" data-h="${h}">${l}</button>`).join('')}</div>` : ''}
      <div class="tempo" role="group" aria-label="Speed"><button type="button" class="icon-btn sm" data-t="-5" aria-label="Slower">${icon('minus')}</button><span><b class="tv">${st.tempo}</b><small>bpm</small></span><button type="button" class="icon-btn sm" data-t="5" aria-label="Faster">${icon('plus')}</button></div>
      <button type="button" class="icon-btn sm opt-lab${st.labels ? ' on' : ''}" aria-pressed="${st.labels}" aria-label="Show note names" title="Note names"><span class="lab-txt">A–G</span></button>
    </div>
    <div class="pl-score" aria-live="off"></div>
    <div class="pl-status" role="status"></div>
    <div class="pl-modes">
      <button type="button" class="btn sm ghost" data-mode="listen">${icon('play')} Listen</button>
      <button type="button" class="btn sm primary" data-mode="wait">${icon('hand')} Play along</button>
      <button type="button" class="btn sm ghost" data-mode="time">${icon('metro')} In time</button>
    </div>
    ${opts.kb === false ? '' : '<div class="pl-kb"></div>'}
  </div>`;
  const root = host.firstElementChild;
  const scoreEl = $('.pl-score', root), statusEl = $('.pl-status', root);
  let sc = null, kb = null, sched = null, metro = null, timers = [], unsub = null, steps = [];
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); };

  function draw() {
    const w = scoreEl.clientWidth || host.clientWidth || 340;
    sc = drawPiece(scoreEl, piece, { hands: st.hands, width: w, scale: notationScale(w), labels: st.labels, fingers: S.prefs.fingers, tempo: opts.showTempo ? st.tempo : null, label: opts.title });
    sc.svg.addEventListener('click', e => {
      const g = e.target.closest('.ev');
      if (!g || st.mode) return;
      const ev = sc.staves[+g.dataset.s].events[+g.dataset.i];
      if (!ev.rest) playChord(eventMidis(ev), 0.9, 0, 0.7);
    });
    $$('.hands [data-h]', root).forEach(b => b.setAttribute('aria-checked', b.dataset.h === st.hands));
  }
  function allNotes() { return [].concat(...piece.staves.filter(s => st.hands.includes(s.hand)).map(s => [].concat(...s.events.map(eventMidis)))); }
  function setupKb() {
    const el = $('.pl-kb', root);
    if (!el) return;
    const ms = allNotes();
    let lo = Math.min(...ms), hi = Math.max(...ms);
    if (hi - lo < 14) { const mid = Math.round((lo + hi) / 2); lo = mid - 8; hi = mid + 8; }
    if (!kb) kb = createKeyboard(el, { from: lo - 1, to: hi + 1, labels: 'c' });
    else kb.fit([lo, hi], 1);
  }
  const say = (html, cls = '') => { statusEl.className = 'pl-status ' + cls; statusEl.innerHTML = html; };
  function idle() {
    say(opts.prompt || `${icon('info')} Tap <b>Listen</b> to hear it, then <b>Play along</b>: I’ll wait for each note.`);
    $$('.pl-modes [data-mode]', root).forEach(b => b.classList.remove('active'));
  }
  function stop(quiet) {
    if (sched) sched.stop();
    if (metro) metro.stop();
    sched = metro = null;
    timers.forEach(clearTimeout);
    timers = [];
    if (unsub) unsub();
    unsub = null;
    hush();
    if (sc) { sc.unmark('on'); sc.unmark('done'); sc.unmark('bad'); }
    if (kb) kb.clear();
    st.mode = null;
    $$('.pl-modes [data-mode]', root).forEach(b => b.classList.remove('active'));
    if (!quiet) idle();
  }
  function scrollToEv(s, i) {
    const p = sc && sc.pos(sc.staffMap.indexOf(s), i);
    if (!p) return;
    const ln = sc.lines[p.line];
    const top = ln.y * NSP * (sc.scale / NSP), h = ln.h * sc.scale;
    if (scoreEl.scrollHeight > scoreEl.clientHeight + 4) {
      if (top < scoreEl.scrollTop || top + h > scoreEl.scrollTop + scoreEl.clientHeight) scoreEl.scrollTo({ top: Math.max(0, top - 6), behavior: reduceMotion() ? 'auto' : 'smooth' });
    } else {
      const r = sc.svg.getBoundingClientRect(), y = r.top + top;
      if (y < 60 || y + h > window.innerHeight - 160) window.scrollTo({ top: window.scrollY + y - 90, behavior: reduceMotion() ? 'auto' : 'smooth' });
    }
  }
  const markEv = ([s, i], cls) => { const g = sc && sc.elFor(s, i); if (g) g.classList.add(cls); };
  const unmarkEv = ([s, i], cls) => { const g = sc && sc.elFor(s, i); if (g) g.classList.remove(cls); };
  function stepFingers(step) {
    return step.notes.map(m => {
      for (const [s, i] of step.evs) {
        const ev = piece.staves[s].events[i], j = ev.ps.findIndex(p => p.m === m);
        if (j >= 0 && ev.fing && ev.fing[j]) return String(ev.fing[j]);
      }
      return '';
    });
  }

  /* ---- Listen ---- */
  function listen() {
    stop(true);
    st.mode = 'listen';
    say(`${icon('play')} Listening… follow the notes as they light up.`);
    const items = [];
    piece.staves.forEach((sv, s) => {
      if (!st.hands.includes(sv.hand)) return;
      sv.events.forEach((ev, i) => {
        if (ev.rest || ev.tied) return;
        let d = ev.d, j = i;
        while (sv.events[j].tie && sv.events[j + 1]) { j++; d += sv.events[j].d; }
        items.push({ at: ev.t, d, ms: eventMidis(ev), s, i, art: ev.art });
      });
    });
    items.sort((a, b) => a.at - b.at);
    const spb = secPerQ(st.tempo, piece.time ? parseTime(piece.time) : null);
    sched = scheduler(items, spb, {
      lead: 0.25,
      end: piece.len,
      fn: (t, it) => {
        playChord(it.ms, it.art === 'stacc' ? spb * 0.4 : Math.max(0.12, it.d * spb * 0.95), t, 0.66);
        const delay = Math.max(0, (t - audioNow()) * 1000);
        later(() => {
          markEv([it.s, it.i], 'on');
          scrollToEv(it.s, it.i);
          if (kb) kb.mark(it.ms, 'target');
          later(() => { unmarkEv([it.s, it.i], 'on'); if (kb) kb.unmark(it.ms, 'target'); }, Math.max(120, it.d * spb * 1000 - 40));
        }, delay);
      },
      done: () => { st.mode = null; say(`${icon('check')} That’s how it goes. Now try <b>Play along</b>.`, 'ok'); $$('.pl-modes [data-mode]', root).forEach(b => b.classList.remove('active')); },
    });
  }

  /* ---- Play along: waits for each note ---- */
  function wait() {
    stop(true);
    st.mode = 'wait';
    steps = pieceSteps(piece, st.hands);
    st.k = 0; st.wrong = 0; st.got = new Set(); st.started = 0;
    unsub = onInput(ev => {
      if (ev.type !== 'on' || st.mode !== 'wait') return;
      const step = steps[st.k];
      if (!step) return;
      if (!st.started) st.started = performance.now();
      const m = ev.m;
      const hit = step.notes.find(n => n === m || (ev.src === 'mic' && mod(n - m, 12) === 0));
      if (hit !== undefined) {
        st.got.add(hit);
        if (kb) { kb.unmark(hit, 'target'); kb.flash(hit, 'ok', 300); }
        if (st.got.size >= step.notes.length || ev.src === 'mic') advance();
      } else {
        st.wrong++;
        if (kb && m >= kb.from && m <= kb.to) kb.flash(m, 'bad', 380);
        say(`${icon('x')} That was ${noteLabel(spell(m))}. Look for the ${step.notes.length > 1 ? 'blue keys' : 'blue key'}.`, 'bad');
        buzz(25);
      }
    }, true);
    showStep();
  }
  function showStep() {
    const step = steps[st.k];
    if (!step) return;
    step.evs.forEach(e => markEv(e, 'on'));
    scrollToEv(step.evs[0][0], step.evs[0][1]);
    if (kb) {
      kb.clear('target');
      kb.mark(step.notes, 'target', stepFingers(step));
      kb.scrollTo(step.notes[0]);
    }
    const names = step.notes.map(m => noteLabel(spell(m, piece.key && KEY_SIGS[piece.key] < 0))).join(' + ');
    say(`<span class="pl-count">${st.k + 1}/${steps.length}</span> ${INPUT_HINT()}${st.labels ? `: <b>${names}</b>` : ''}`);
  }
  function advance() {
    const step = steps[st.k];
    step.evs.forEach(e => { unmarkEv(e, 'on'); markEv(e, 'done'); });
    st.got = new Set();
    st.k++;
    if (st.k >= steps.length) { finish('wait'); return; }
    showStep();
  }

  /* ---- In time: count-in, then the cursor moves with the beat ---- */
  function inTime() {
    stop(true);
    st.mode = 'time';
    steps = pieceSteps(piece, st.hands);
    const time = parseTime(piece.time);
    const spb = secPerQ(st.tempo, time);
    const beatSec = spb * time.beat;
    const startT = audioNow() + 0.15 + time.beats * beatSec + (piece.pickup ? -piece.pickup * spb : 0);
    say(`${icon('metro')} Count in: listen for ${time.beats} clicks, then play.`);
    const total = startT + piece.len * spb;
    // Clicks from the count-in to the end.
    const clicks = [];
    for (let t = startT - time.beats * beatSec + (piece.pickup ? piece.pickup * spb : 0), n = 0; t < total - 1e-3; t += beatSec, n++) clicks.push({ at: n, beatInBar: n % time.beats });
    const t0 = startT - time.beats * beatSec + (piece.pickup ? piece.pickup * spb : 0);
    const clickSched = scheduler(clicks.map(x => ({ ...x, at: x.at })), beatSec, { lead: Math.max(0.05, t0 - audioNow()), end: clicks.length, fn: (t, it) => { if (st.metro) click(t, it.beatInBar === 0 ? 0 : 1); } });
    const judge = steps.map(s => ({ ...s, time: startT + s.t * spb, hit: new Set(), ok: false }));
    let wrongs = 0;
    unsub = onInput(ev => {
      if (ev.type !== 'on' || st.mode !== 'time') return;
      const tAudio = audioNow() - (S.prefs.latency || 0) / 1000;
      const win = Math.min(0.35, spb * 0.45);
      const cand = judge.find(j => !j.ok && Math.abs(tAudio - j.time) < win && j.notes.some(n => n === ev.m || (ev.src === 'mic' && mod(n - ev.m, 12) === 0)));
      if (cand) {
        cand.hit.add(ev.m);
        if (cand.hit.size >= cand.notes.length || ev.src === 'mic') { cand.ok = true; cand.evs.forEach(e => markEv(e, 'done')); }
        if (kb) kb.flash(ev.m, 'ok', 250);
      } else { wrongs++; if (kb && ev.m >= kb.from && ev.m <= kb.to) kb.flash(ev.m, 'bad', 300); }
    }, true);
    // Cursor.
    judge.forEach(j => {
      later(() => {
        if (st.mode !== 'time') return;
        j.evs.forEach(e => markEv(e, 'on'));
        scrollToEv(j.evs[0][0], j.evs[0][1]);
        if (kb) { kb.clear('target'); kb.mark(j.notes, 'target', stepFingers(j)); }
        later(() => j.evs.forEach(e => { unmarkEv(e, 'on'); if (!j.ok) markEv(e, 'miss'); }), Math.max(150, spb * 900));
      }, Math.max(0, (j.time - audioNow()) * 1000));
    });
    later(() => { if (st.mode === 'time') say(`${icon('metro')} Play along with the clicks.`); }, Math.max(0, (startT - audioNow()) * 1000));
    later(() => {
      if (st.mode !== 'time') return;
      clickSched.stop();
      const okN = judge.filter(j => j.ok).length;
      const heard = IN.midi.status === 'on' || IN.mic.on || okN > 0 || wrongs > 0;
      finish('time', heard ? okN / Math.max(1, judge.length + wrongs * 0.5) : null);
    }, Math.max(0, (total - audioNow()) * 1000 + 600));
    sched = clickSched;
  }

  function finish(mode, score) {
    const secs = st.started ? (performance.now() - st.started) / 1000 : 0;
    const acc = mode === 'wait' ? steps.length / (steps.length + st.wrong) : score;
    if (unsub) unsub();
    unsub = null;
    st.mode = null;
    if (kb) kb.clear();
    $$('.pl-modes [data-mode]', root).forEach(b => b.classList.remove('active'));
    const pct = acc === null || acc === undefined ? null : Math.round(acc * 100);
    const praise = pct === null ? 'How did that feel?' : pct >= 95 ? 'Brilliant!' : pct >= 80 ? 'Nice work!' : pct >= 60 ? 'Getting there.' : 'Good start. Try it slower.';
    say(`<b>${praise}</b>${pct !== null ? ` ${pct}% right${mode === 'wait' && st.wrong ? ` · ${plural(st.wrong, 'slip')}` : ''}${secs ? ` · ${Math.round(secs)} s` : ''}` : ''}
      <div class="rate" role="group" aria-label="How did it go?">${[[1, 'Tricky'], [2, 'Getting there'], [3, 'Nailed it']].map(([n, l]) => `<button type="button" class="btn sm ghost" data-rate="${n}">${'★'.repeat(n)} ${l}</button>`).join('')}</div>`, pct !== null && pct >= 80 ? 'ok' : '');
    if (pct !== null && pct >= 95) confetti(16);
    st.last = { mode, acc, secs, hands: st.hands, tempo: st.tempo };
    if (opts.onFinish) opts.onFinish({ ...st.last, rated: false });
  }

  root.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || !root.contains(b)) return;
    if (b.dataset.mode) {
      if (st.mode === b.dataset.mode) { stop(); return; }
      if (b.dataset.mode === 'listen') listen(); else if (b.dataset.mode === 'wait') wait(); else inTime();
      b.classList.add('active');
      return;
    }
    if (b.dataset.h) { stop(true); st.hands = b.dataset.h; draw(); setupKb(); idle(); return; }
    if (b.dataset.t) { st.tempo = clamp(st.tempo + +b.dataset.t, 30, 220); $('.tv', root).textContent = st.tempo; if (st.mode === 'listen' || st.mode === 'time') stop(); return; }
    if (b.classList.contains('opt-lab')) { st.labels = !st.labels; b.classList.toggle('on', st.labels); b.setAttribute('aria-pressed', st.labels); const m = st.mode; stop(true); draw(); if (m) idle(); else idle(); return; }
    if (b.dataset.rate) {
      $$('.rate button', root).forEach(x => x.classList.toggle('on', x === b));
      if (opts.onRate) opts.onRate(+b.dataset.rate, st.last);
    }
  });
  draw();
  setupKb();
  idle();
  if (opts.autoMode === 'wait') { wait(); $('[data-mode="wait"]', root).classList.add('active'); }
  let lastW = scoreEl.clientWidth;
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { const w = scoreEl.clientWidth; if (Math.abs(w - lastW) > 8 && !st.mode) { lastW = w; draw(); } }) : null;
  if (ro) ro.observe(scoreEl);
  return {
    stop,
    get state() { return st; },
    destroy() { stop(true); if (ro) ro.disconnect(); if (kb) kb.destroy(); },
  };
}
