/* Crescendo — settings, first-run setup, backups, reminders and start-up */
'use strict';

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const weekEditor = week => `<div class="week-edit">${WEEK_ORDER.map(d => `<div class="we-row"><span>${WD_LONG[d]}</span>
  <div class="stepper sm"><button type="button" data-act="wk" data-d="${d}" data-v="-5" aria-label="Less on ${WD_LONG[d]}">${icon('minus')}</button><output>${week[d] ? `${week[d]} min` : 'Rest'}</output><button type="button" data-act="wk" data-d="${d}" data-v="5" aria-label="More on ${WD_LONG[d]}">${icon('plus')}</button></div></div>`).join('')}</div>`;
function paceLine(week) {
  const w = sum(week);
  if (!w) return 'Pick at least one practice day.';
  const left = LESSONS.filter(l => !lessonDone(l.id));
  const weeks = Math.ceil(sum(left.map(lessonCost)) / w);
  const firstChords = Math.ceil(sum(left.filter(l => l.u < 5).map(lessonCost)) / w);
  const span = n => (n > 10 ? `${Math.round(n / 4.35)} months` : plural(n, 'week'));
  return `${fmtMins(w)} a week. At this pace you’d be playing chords in about <b>${span(firstChords)}</b> and finish the course in about <b>${span(weeks)}</b>, practising each lesson before moving on.`;
}

function exportData() {
  const json = JSON.stringify(S, null, 1);
  const name = `crescendo-backup-${today()}.json`;
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('Backup saved to your downloads');
}
function importData(file) {
  const r = new FileReader();
  r.onload = () => {
    let d = null;
    try { d = JSON.parse(r.result); } catch (e) { d = null; }
    if (!d || typeof d !== 'object' || !d.prefs || !Array.isArray(d.week)) { toast('That file isn’t a Crescendo backup'); return; }
    confirmSheet({ title: 'Restore this backup?', body: `It replaces everything on this device with the backup${d.savedAt ? ` from ${fmtDay(dkey(new Date(d.savedAt)))}` : ''}.`, yes: 'Restore', danger: true,
      onYes: () => { S = migrate(d); S.onboarded = true; save(); applyPrefs(); render(true); toast('Backup restored'); } });
  };
  r.readAsText(file);
}
// A calendar file with a weekly practice reminder for each practice day.
function reminderIcs() {
  const [hh, mm] = S.prefs.remind.split(':').map(Number);
  const by = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const t = today();
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Crescendo//Practice//EN', 'CALSCALE:GREGORIAN'];
  for (let i = 0; i < 7; i++) {
    const d = addDays(t, i + 1), dw = dowOf(d), m = S.week[dw];
    if (!m) continue;
    const st = `${d.replace(/-/g, '')}T${pad(hh)}${pad(mm)}00`;
    lines.push('BEGIN:VEVENT', `UID:crescendo-${by[dw]}-${Date.now()}@practice`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
      `DTSTART:${st}`, `DURATION:PT${m}M`, `RRULE:FREQ=WEEKLY;BYDAY=${by[dw]}`, `SUMMARY:Piano practice (${m} min)`,
      'DESCRIPTION:Open Crescendo for today’s plan.', 'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:Time to practise piano', 'END:VALARM', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'piano-practice.ics';
  document.body.append(a);
  a.click();
  a.remove();
  toast('Open the downloaded file to add the reminders to your calendar');
}
function applyPrefs() {
  setVolume(S.prefs.vol);
  setMetVolume(S.prefs.metVol);
  document.documentElement.style.setProperty('--ns', S.prefs.size);
}

/* ---------- settings ---------- */
function openSettings() {
  let micTimer = null, unChord = null;
  const inputRow = () => {
    const midi = IN.midi.status, mic = IN.mic.status;
    return `<div class="seg" role="radiogroup" aria-label="How Crescendo hears you">${[['touch', 'Screen keys'], ['midi', 'MIDI piano'], ['mic', 'Microphone']].map(([k, l]) => `<button type="button" role="radio" aria-checked="${S.prefs.input === k}" class="${S.prefs.input === k ? 'on' : ''}" data-act="input" data-v="${k}">${l}</button>`).join('')}</div>
      ${S.prefs.input === 'midi' ? `<p class="small">${midi === 'on' ? `${icon('check')} Connected: <b>${esc(IN.midi.names.join(', '))}</b>` : midi === 'none' ? 'No MIDI keyboard found. Plug it in (a USB-C adapter works for most phones), then tap Connect.' : midi === 'unsupported' || !MIDI_OK ? (IOS ? 'iPhone and iPad can’t connect to a keyboard by cable or Bluetooth MIDI. Choose <b>Microphone</b> instead: Crescendo hears your keyboard through its speakers.' : 'This browser can’t connect to a keyboard by cable. Choose <b>Microphone</b>, or use Chrome or Edge.') : midi === 'denied' ? 'MIDI access was blocked. Allow it in your browser settings.' : 'Connect a digital piano or keyboard by USB or Bluetooth MIDI.'}</p>
        ${MIDI_OK ? `<div class="btn-row"><button type="button" class="btn sm" data-act="midi">${icon('plug')} ${midi === 'on' ? 'Reconnect' : 'Connect'}</button></div>${switchRow('midiSound', 'Play Crescendo’s sound too', 'Turn on if your keyboard has no speakers', S.prefs.midiSound)}` : ''}` : ''}
      ${S.prefs.input === 'mic' ? `<p class="small">Crescendo listens through your microphone while an exercise or song needs to hear you. It recognises single notes and chords, and adjusts to a piano that isn’t quite in tune. Works best in a quiet room with the phone near the piano. Nothing is recorded or sent anywhere.</p>
        <div class="mic-meter"><i style="width:0%"></i></div><p class="small mic-heard">${mic === 'on' ? 'Listening… play a note or a chord.' : mic === 'denied' ? 'Microphone access was blocked. Allow it in your browser settings.' : 'Tap Start to test it with a note or a chord.'}</p>
        <div class="btn-row"><button type="button" class="btn sm" data-act="mic">${icon('mic')} ${IN.mic.on ? 'Stop listening' : 'Start listening'}</button></div>
        <div class="switch-row"><span><b>Sensitivity</b><small>Raise it if quiet notes are missed</small></span>${stepper('sens', `${Math.round(S.prefs.micSens * 100)}%`, 'Microphone sensitivity')}</div>` : ''}
      ${S.prefs.input === 'touch' ? '<p class="small">Tap the keys on screen. On a computer you can also use the keyboard: A–K for white notes, W E T Y U for black notes, Z/X to change octave.</p>' : ''}`;
  };
  const tpl = () => `${sheetHead('Settings', `Crescendo ${APP_VERSION}`)}
    <div class="set-group"><h3>You</h3><div class="card pad"><label class="field"><span>Your name</span><input class="input" name="name" maxlength="40" value="${esc(S.name)}" placeholder="For a friendly hello" autocomplete="given-name"></label></div></div>
    <div class="set-group"><h3>Practice time</h3><div class="card pad"><p class="small muted">Minutes for each day. Your daily plan is built around them.</p>${weekEditor(S.week)}<p class="small pace">${paceLine(S.week)}</p>
      <h4>Usually away from the piano on</h4><p class="small muted">On these days your plan is theory you can do anywhere. You can still switch on the day.</p>
      <div class="chips away-days" role="group" aria-label="Usually away from the piano">${WEEK_ORDER.map(d => `<button type="button" class="chip${S.awayWeek[d] ? ' on' : ''}" aria-pressed="${!!S.awayWeek[d]}" data-act="awayday" data-d="${d}">${WD[d]}</button>`).join('')}</div></div></div>
    <div class="set-group"><h3>Your piano</h3><div class="card pad">
      <div class="seg sm" role="radiogroup" aria-label="Instrument">${[['acoustic', 'Acoustic'], ['digital', 'Digital / keyboard'], ['none', 'None yet']].map(([k, l]) => `<button type="button" role="radio" aria-checked="${S.prefs.instrument === k}" class="${S.prefs.instrument === k ? 'on' : ''}" data-act="inst" data-v="${k}">${l}</button>`).join('')}</div>
      <h4>How Crescendo hears you</h4><div class="input-pick">${inputRow()}</div></div></div>
    <div class="set-group"><h3>Sound</h3><div class="card pad">
      <div class="switch-row"><span><b>Can you hear it?</b><small>${IOS ? 'No sound? Turn it up with the side buttons. Crescendo should play even in Silent mode; if it stays quiet, turn Silent mode off.' : 'No sound? Check your phone’s volume.'}</small></span><button type="button" class="btn sm" data-act="testSound">${icon('play')} Test</button></div>
      <label class="field"><span>Piano volume</span><input type="range" name="vol" min="0" max="1" step="0.05" value="${S.prefs.vol}"></label>
      <label class="field"><span>Metronome volume</span><input type="range" name="metVol" min="0" max="1" step="0.05" value="${S.prefs.metVol}"></label>
      <div class="switch-row"><span><b>Tap timing</b><small>${S.prefs.latency ? `Adjusted by ${S.prefs.latency} ms` : 'Calibrate if rhythm scores seem off'}</small></span><button type="button" class="btn sm" data-act="calib">Calibrate</button></div></div></div>
    <div class="set-group"><h3>Reading music</h3><div class="card pad">
      <div class="field"><span>Note-length names</span><div class="seg sm">${[['au', 'Crotchet, quaver (AU/UK)'], ['us', 'Quarter, eighth (US)']].map(([k, l]) => `<button type="button" class="${S.prefs.terms === k ? 'on' : ''}" data-act="terms" data-v="${k}">${l}</button>`).join('')}</div></div>
      <div class="field"><span>Letter names under notes</span><div class="seg sm">${[['auto', 'While learning'], ['always', 'Always'], ['never', 'Never']].map(([k, l]) => `<button type="button" class="${S.prefs.labels === k ? 'on' : ''}" data-act="labels" data-v="${k}">${l}</button>`).join('')}</div></div>
      ${switchRow('fingers', 'Finger numbers', 'Show fingering in the music', S.prefs.fingers)}
      <div class="switch-row"><span><b>Music size</b><small>How big notes are drawn</small></span>${stepper('size', `${Math.round(S.prefs.size * 100)}%`, 'Music size')}</div></div></div>
    <div class="set-group"><h3>Look and feel</h3><div class="card pad">${switchRow('fx', 'Celebrations', 'Confetti and vibration', S.prefs.fx)}</div></div>
    <div class="set-group"><h3>Reminder</h3><div class="card pad"><p class="small muted">Add a weekly reminder to your phone’s calendar for each practice day.</p>
      <div class="row"><label class="field grow"><span>Time</span><input class="input" type="time" name="remind" value="${S.prefs.remind}"></label><button type="button" class="btn sm" data-act="ics">${icon('cal')} Add to calendar</button></div></div></div>
    <div class="set-group"><h3>Your data</h3><div class="card pad"><p class="small muted">${SAVE_OK ? 'Saved in this browser on this device. Nothing is sent anywhere, so back up now and then.' : '⚠️ This browser is blocking storage.'}</p>
      <div class="btn-row"><button type="button" class="btn" data-act="export">${icon('down')} Back up</button><button type="button" class="btn ghost" data-act="import">${icon('up')} Restore</button></div>
      <input type="file" name="file" accept="application/json,.json" hidden>
      <div class="btn-row"><button type="button" class="btn ghost danger-t" data-act="reset">Start over</button></div></div></div>
    <p class="fine">Crescendo ${APP_VERSION}. The piano sound is synthesised in your browser. Music font: a subset of Bravura (© Steinberg Media Technologies GmbH, SIL Open Font License 1.1), renamed “Crescendo Notation”. Text fonts: DM Serif Display and Figtree (SIL OFL 1.1). Songs are public domain or original arrangements.</p>`;
  const sh = openSheet(tpl(), {
    label: 'Settings', cls: 'tall',
    onSet: s => {
      clearInterval(micTimer);
      if (unChord) { unChord(); unChord = null; }
      if (S.prefs.input !== 'mic') return;
      unChord = onChord(() => {});
      micTimer = setInterval(() => {
        const m = $('.mic-meter i', s.el), h = $('.mic-heard', s.el);
        if (!m) return;
        m.style.width = `${Math.round(IN.mic.level * 100)}%`;
        if (!IN.mic.on || !h) return;
        const { ms, mic } = playingNow(), ch = identifyChord(ms);
        h.textContent = mic && ms.length > 1 ? `I hear: ${ms.map(x => playingName(x, true)).join(' ')}${ch.length ? ` · ${chordName(ch[0].replace(/\/.*/, ''))}` : ''}` : IN.mic.heard !== null ? `I hear: ${noteFull(spell(IN.mic.heard))}` : 'Listening… play a note or a chord.';
      }, 80);
    },
    onClose: () => { clearInterval(micTimer); if (unChord) unChord(); if (MIC.manual) { MIC.manual = false; if (!IN.ears) micStop(); } save(); render(); },
    act: {
      wk(a, e, s) { const d = +a.dataset.d; S.week[d] = clamp(S.week[d] + +a.dataset.v, 0, 120); save(); s.set(tpl()); },
      awayday(a, e, s) { const d = +a.dataset.d; S.awayWeek[d] = !S.awayWeek[d]; save(); s.set(tpl()); },
      inst(a, e, s) { S.prefs.instrument = a.dataset.v; save(); s.set(tpl()); },
      async input(a, e, s) { S.prefs.input = a.dataset.v; if (a.dataset.v !== 'mic' && IN.mic.on) micStop(); if (a.dataset.v === 'midi') await midiConnect(); save(); s.set(tpl()); },
      async midi(a, e, s) { await midiConnect(); s.set(tpl()); },
      async mic(a, e, s) { if (IN.mic.on) micStop(); else { MIC.manual = true; if (!(await micStart())) MIC.manual = false; } s.set(tpl()); },
      testSound() { playSeq([60, 64, 67, 72], 0.22, 0.6); },
      step(a, e, s) {
        const n = a.dataset.name, d = +a.dataset.d;
        if (n === 'sens') S.prefs.micSens = clamp(Math.round((S.prefs.micSens + d * 0.25) * 100) / 100, 0.5, 2);
        if (n === 'size') { S.prefs.size = clamp(Math.round((S.prefs.size + d * 0.1) * 10) / 10, 0.8, 1.5); applyPrefs(); }
        save(); s.set(tpl());
      },
      terms(a, e, s) { S.prefs.terms = a.dataset.v; save(); s.set(tpl()); },
      labels(a, e, s) { S.prefs.labels = a.dataset.v; save(); s.set(tpl()); },
      calib(a, e, s) { s.close(); openCalibration(); },
      ics() { reminderIcs(); },
      export() { exportData(); },
      import(a, e, s) { $('input[name="file"]', s.el).click(); },
      reset(a, e, s) {
        confirmSheet({ title: 'Start over?', body: 'This deletes all your progress, songs, stats and settings on this device. Back up first if you might want them.', yes: 'Delete everything', danger: true,
          onYes: () => { try { localStorage.removeItem(STORE_KEY); } catch (err) { /* blocked */ } S = freshState(); save(); location.hash = '#/today'; render(true); startOnboarding(); } });
      },
    },
    input(e) {
      const t = e.target;
      if (t.name === 'name') { S.name = t.value.trim().slice(0, 40); clearTimeout(t._t); t._t = setTimeout(save, 300); }
      if (t.name === 'vol') { S.prefs.vol = +t.value; setVolume(S.prefs.vol); playNote(67, 0.3); }
      if (t.name === 'metVol') { S.prefs.metVol = +t.value; setMetVolume(S.prefs.metVol); click(audioNow() + 0.02, 1); }
    },
    change(e, s) {
      const t = e.target;
      if (t.name === 'file') { if (t.files && t.files[0]) importData(t.files[0]); t.value = ''; return; }
      if (t.name === 'remind') { S.prefs.remind = t.value || '18:30'; save(); return; }
      if (t.type === 'checkbox') { S.prefs[t.name] = t.checked; save(); }
    },
  });
  return sh;
}
// Tap along with 12 clicks; the average offset becomes the timing adjustment.
function openCalibration() {
  let met = null, clicks = [], taps = [], on = false;
  const tap = t => { if (on) taps.push(t); };
  const key = e => { if (e.code === 'Space') { e.preventDefault(); tap(performance.now()); } };
  const un = onInput(ev => { if (ev.type === 'on') tap(ev.at); });
  document.addEventListener('keydown', key);
  const sheet = openSheet(`${sheetHead('Tap timing')}<p class="lead">Tap the pad${S.prefs.input === 'midi' ? ' (or a key on your keyboard)' : ''} exactly with each click. 12 clicks.</p>
    <button type="button" class="tap-pad" aria-label="Tap here">TAP</button><p class="cal-res small center"></p>
    <div class="btn-row"><button type="button" class="btn primary" data-act="go">Start</button></div>`, {
    label: 'Tap timing',
    onClose: () => { if (met) met.stop(); un(); document.removeEventListener('keydown', key); },
    act: {
      go(a, e, sh) {
        if (on) return;
        clicks = []; taps = []; on = true;
        met = metronome({ bpm: 90, beats: 4, countIn: 12, onBeat: (b, s, t) => clicks.push(ctxToPerf(t)) });
        setTimeout(() => {
          on = false;
          const offs = clicks.slice(2).map(c => taps.reduce((best, tp) => (Math.abs(tp - c) < Math.abs(best) ? tp - c : best), 1e9)).filter(d => Math.abs(d) < 250);
          const res = $('.cal-res', sh.el);
          if (offs.length < 6) { res.textContent = 'Not enough taps landed near the clicks. Try again.'; return; }
          offs.sort((x, y) => x - y);
          const med = Math.round(offs[Math.floor(offs.length / 2)]);
          S.prefs.latency = clamp(med, -150, 300);
          save();
          res.innerHTML = `Done. Your taps land about <b>${Math.abs(med)} ms ${med >= 0 ? 'after' : 'before'}</b> the click, so Crescendo will allow for that.`;
        }, (12 * 60000) / 90 + 900);
      },
    },
  });
  onTapPad($('.tap-pad', sheet.el), t => {
    tap(t);
    const p = $('.tap-pad', sheet.el);
    p.classList.remove('hit'); void p.offsetWidth; p.classList.add('hit');
  });
}

/* ---------- first-run setup ---------- */
function startOnboarding() {
  const root = $('#onboard-root');
  const st = { step: 0, name: S.name, inst: S.prefs.instrument, week: S.week.slice(), terms: S.prefs.terms, start: 1 };
  const PRESETS = [['10 min a day', [10, 10, 10, 10, 10, 10, 10]], ['15 min a day', [15, 15, 15, 15, 15, 15, 15]], ['20 weekdays, 30 weekends', [30, 20, 20, 20, 20, 20, 30]], ['30 min a day', [30, 30, 30, 30, 30, 30, 30]], ['45 min, 5 days', [0, 45, 45, 45, 45, 45, 0]]];
  const body = () => {
    if (st.step === 0) return `<div class="ob-art">${ART.piano}</div><h1>Crescendo</h1><p class="tag">Piano, from the very first note</p>
      <p class="lead">Short lessons, a daily practice plan built around your time, and real music to play: reading, rhythm, scales, chords and songs.</p>
      <label class="field"><span>What should we call you?</span><input class="input" name="name" maxlength="40" value="${esc(st.name)}" placeholder="Your name (optional)" autocomplete="given-name"></label>`;
    if (st.step === 1) return `<h1>What will you play on?</h1><p class="lead">Crescendo works with any piano, and with the keys on screen.</p>
      <div class="pick">${[['acoustic', 'An acoustic piano', 'Crescendo listens through the microphone.'], ['digital', 'A digital piano or keyboard', MIDI_OK ? 'Connect it by USB or Bluetooth so Crescendo hears every note.' : 'Crescendo listens through the microphone (this phone can’t connect to a keyboard by cable).'], ['none', 'No piano yet', 'Use the on-screen keys for now.']].map(([k, t, s]) => `<button type="button" class="pick-o${st.inst === k ? ' on' : ''}" data-act="inst" data-v="${k}"><b>${t}</b><small>${s}</small></button>`).join('')}</div>
      <p class="small muted">You can change how Crescendo hears you any time in Settings.</p>`;
    if (st.step === 2) return `<h1>How long can you practise?</h1><p class="lead">Pick a routine. Your daily plan fits the time you choose, and you can change any day.</p>
      <div class="chips wrap">${PRESETS.map(([l, w], i) => `<button type="button" class="chip${JSON.stringify(w) === JSON.stringify(st.week) ? ' on' : ''}" data-act="preset" data-i="${i}">${l}</button>`).join('')}</div>
      ${weekEditor(st.week)}<p class="pace small">${paceLine(st.week)}</p>`;
    return `<h1>Last thing</h1><h3>Music words</h3><div class="pick two">${[['au', 'Crotchet, quaver, bar', 'Australia, UK'], ['us', 'Quarter note, eighth note, measure', 'United States']].map(([k, t, s]) => `<button type="button" class="pick-o${st.terms === k ? ' on' : ''}" data-act="terms" data-v="${k}"><b>${t}</b><small>${s}</small></button>`).join('')}</div>
      <h3>Where to start</h3><div class="pick">${[[1, 'The very beginning', 'Recommended: sitting, finding notes and your first tunes.'], [2, 'I know my way around the keys', 'Skip Unit 1 and start reading music.'], [3, 'I can read a little', 'Skip to hands together.']].map(([n, t, s]) => `<button type="button" class="pick-o${st.start === n ? ' on' : ''}" data-act="start" data-v="${n}"><b>${t}</b><small>${s}</small></button>`).join('')}</div>`;
  };
  const draw = () => {
    root.innerHTML = `<div class="onboard" role="dialog" aria-modal="true" aria-label="Welcome to Crescendo"><div class="ob-inner">
      <div class="dots">${[0, 1, 2, 3].map(i => `<i class="${i === st.step ? 'on' : ''}"></i>`).join('')}</div><div class="ob-body">${body()}</div>
      <div class="ob-foot">${st.step ? `<button type="button" class="btn ghost" data-act="back">Back</button>` : ''}<button type="button" class="btn primary grow" data-act="${st.step === 3 ? 'finish' : 'next'}">${st.step === 3 ? 'Start practising' : 'Next'} ${icon('chev-r')}</button></div></div></div>`;
  };
  const finish = () => {
    S.name = st.name.trim().slice(0, 40);
    S.prefs.instrument = st.inst;
    S.prefs.input = st.inst === 'none' ? 'touch' : st.inst === 'digital' && MIDI_OK ? 'midi' : 'mic';
    S.prefs.terms = st.terms;
    S.week = st.week;
    LESSONS.filter(l => l.u < st.start).forEach(l => { S.lessons[l.id] = { done: today(), at: 0 }; (l.skills || []).forEach(unlockSkill); (l.songs || []).forEach(s => { S.songs[s] = S.songs[s] || { stars: 0, best: 0, plays: 0, last: '', mins: 0 }; }); });
    S.onboarded = true;
    save();
    root.innerHTML = '';
    document.body.classList.remove('locked');
    location.hash = '#/today';
    render(true);
    if (S.prefs.input === 'midi') midiConnect();
    setTimeout(() => { confetti(30); toast(`Welcome${S.name ? `, ${esc(S.name)}` : ''}! Here’s today’s plan.`); }, 300);
  };
  document.body.classList.add('locked');
  draw();
  root.onclick = e => {
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const k = a.dataset.act;
    if (k === 'next') { st.step++; draw(); }
    else if (k === 'back') { st.step--; draw(); }
    else if (k === 'finish') finish();
    else if (k === 'inst') { st.inst = a.dataset.v; draw(); }
    else if (k === 'preset') { st.week = PRESETS[+a.dataset.i][1].slice(); draw(); }
    else if (k === 'wk') { const d = +a.dataset.d; st.week[d] = clamp(st.week[d] + +a.dataset.v, 0, 120); draw(); }
    else if (k === 'terms') { st.terms = a.dataset.v; draw(); }
    else if (k === 'start') { st.start = +a.dataset.v; draw(); }
  };
  root.oninput = e => { if (e.target.name === 'name') st.name = e.target.value; };
}

/* ---------- start-up ---------- */
let DAY = null;
function checkDay() {
  const t = today();
  if (t === DAY) return;
  DAY = t;
  if (!SHEET && UI.cur === 'today') render();
}
// Phones often bring the app back from memory instead of reloading it, so a fix wouldn't arrive until the app was
// fully closed. When Crescendo comes back on screen it checks for a newer version, and reloads, but never in the
// middle of a lesson or practice session: then it waits until you're back on a main screen.
let UPDATE_READY = false, lastUpdateCheck = 0;
const busy = () => document.body.classList.contains('stage') || !!SHEET;
async function checkForUpdate() {
  if (UPDATE_READY || !/^https?:$/.test(location.protocol) || /[?&]nosw/.test(location.search) || Date.now() - lastUpdateCheck < 60000) return;
  lastUpdateCheck = Date.now();
  try {
    const r = await fetch('core.js', { cache: 'no-store' });
    const m = /APP_VERSION = '([^']+)'/.exec(r.ok ? await r.text() : '');
    if (m && m[1] !== APP_VERSION) { UPDATE_READY = true; if (!busy()) location.reload(); }
  } catch (e) { /* offline: try again later */ }
}
async function boot() {
  S = load();
  // Set up for MIDI on a phone that can't use it (iPhone): listen through the microphone instead.
  if (S.prefs.input === 'midi' && !MIDI_OK) { S.prefs.input = S.prefs.instrument === 'none' ? 'touch' : 'mic'; save(); }
  DAY = today();
  applyPrefs();
  $('#view').addEventListener('click', onViewClick);
  document.addEventListener('click', e => { const a = e.target.closest('[data-action="settings"]'); if (a) { e.preventDefault(); openSettings(); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && SHEET) closeSheet(); });
  window.addEventListener('hashchange', () => { closeSheet(true); render(true); if (UPDATE_READY && !busy()) location.reload(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkDay(); checkForUpdate(); } });
  setInterval(checkDay, 30000);
  window.addEventListener('storage', e => { if (e.key === STORE_KEY && !TRACK.kind) { S = load(); if (!SHEET) render(); } });
  try { await Promise.race([Promise.all([document.fonts.load('40px "Crescendo Notation"'), document.fonts.load('16px Figtree')]), sleep(2500)]); } catch (e) { /* fonts are optional */ }
  render(true);
  if (!S.onboarded) startOnboarding();
  else if (S.prefs.input === 'midi') midiConnect();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/[?&]nosw/.test(location.search)) navigator.serviceWorker.register('sw.js').catch(() => {});
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => p || navigator.storage.persist()).catch(() => {}); } catch (e) { /* not supported */ }
}
document.addEventListener('DOMContentLoaded', boot);
