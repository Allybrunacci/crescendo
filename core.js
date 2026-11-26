/* Crescendo — core: helpers, saved data, words, rich text, sheets, toasts, router and practice-time tracking */
'use strict';

const APP_VERSION = '1.2.1';
const STORE_KEY = 'crescendo:v1';

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const sum = a => a.reduce((t, n) => t + n, 0);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + 's'}`;
const icon = (id, cls) => `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const buzz = (ms = 12) => { try { if (navigator.vibrate && S.prefs.fx) navigator.vibrate(ms); } catch (e) { /* not supported */ } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
// When a tap really happened (performance.now() time): the event's own timestamp, if it's on the same clock.
const tapTime = e => { const now = performance.now(), t = e && e.timeStamp; return t > 0 && t <= now + 5 && now - t < 1000 ? t : now; };
// A tap pad (Rhythm, Steady beat, Tap timing): counts the moment a finger lands, not when it lifts.
function onTapPad(el, fn) {
  if (!el) return;
  el.addEventListener('pointerdown', e => { if (e.button > 0) return; e.preventDefault(); fn(tapTime(e)); });
}
function rng(seed) {
  let a = typeof seed === 'string' ? [...seed].reduce((h, ch) => (Math.imul(h ^ ch.charCodeAt(0), 2654435761) >>> 0), 1779033703) : seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (r, a) => a[Math.floor(r() * a.length)];
function shuffle(r, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
function weighted(r, items, w) { const tot = sum(items.map(w)); let x = r() * tot; for (const it of items) { x -= w(it); if (x <= 0) return it; } return items[items.length - 1]; }

/* ---------- dates ---------- */
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WD_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = n => String(n).padStart(2, '0');
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => dkey(new Date());
const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return dkey(d); };
const daysBetween = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 864e5);
const dowOf = k => fromKey(k).getDay();
const isKey = k => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k);
const fmtDay = k => { const d = fromKey(k); return `${WD[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`; };
const fmtShort = k => { const d = fromKey(k); return `${d.getDate()} ${MON[d.getMonth()]}`; };
function fmtMins(m) {
  m = Math.round(m);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}
const weekStartOf = k => addDays(k, -((dowOf(k) - 1 + 7) % 7));

/* ---------- saved data ---------- */
function freshState() {
  return {
    v: 1, created: today(), onboarded: false, name: '',
    prefs: { terms: 'au', labels: 'auto', fingers: true, size: 1, vol: 0.8, metVol: 0.6, midiSound: false, input: 'touch', latency: 0, fx: true, micSens: 1, remind: '18:30', instrument: 'digital', sightNames: 'tap' },
    week: [20, 15, 15, 15, 15, 15, 20],
    over: {},
    lessons: {},
    songs: {},
    skills: {},
    stats: {},
    log: {},
    plans: {},
    badges: {},
    away: {}, awayWeek: [false, false, false, false, false, false, false], aplans: {}, theory: {},
    savedAt: 0,
  };
}
function migrate(d) {
  const s = freshState();
  if (!d || typeof d !== 'object') return s;
  s.created = isKey(d.created) ? d.created : s.created;
  s.onboarded = !!d.onboarded;
  s.name = String(d.name || '').slice(0, 40);
  const p = d.prefs && typeof d.prefs === 'object' ? d.prefs : {};
  s.prefs.terms = p.terms === 'us' ? 'us' : 'au';
  s.prefs.labels = ['auto', 'always', 'never'].includes(p.labels) ? p.labels : 'auto';
  s.prefs.fingers = p.fingers !== false;
  s.prefs.size = clamp(+p.size || 1, 0.8, 1.5);
  s.prefs.vol = clamp(p.vol === undefined ? 0.8 : +p.vol, 0, 1);
  s.prefs.metVol = clamp(p.metVol === undefined ? 0.6 : +p.metVol, 0, 1);
  s.prefs.midiSound = !!p.midiSound;
  s.prefs.input = ['touch', 'midi', 'mic'].includes(p.input) ? p.input : 'touch';
  s.prefs.latency = clamp(Math.round(+p.latency || 0), -150, 300);
  s.prefs.fx = p.fx !== false;
  s.prefs.micSens = clamp(+p.micSens || 1, 0.5, 2);
  s.prefs.remind = /^\d\d:\d\d$/.test(p.remind) ? p.remind : '18:30';
  s.prefs.instrument = ['acoustic', 'digital', 'none'].includes(p.instrument) ? p.instrument : 'digital';
  s.prefs.sightNames = ['off', 'tap', 'all'].includes(p.sightNames) ? p.sightNames : 'tap';
  if (Array.isArray(d.week) && d.week.length === 7) s.week = d.week.map(n => clamp(Math.round(+n || 0), 0, 180));
  const obj = x => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
  for (const [k, v] of Object.entries(obj(d.over))) if (isKey(k)) s.over[k] = clamp(Math.round(+v || 0), 0, 180);
  for (const [k, v] of Object.entries(obj(d.lessons))) if (v && typeof v === 'object') s.lessons[k] = { done: isKey(v.done) ? v.done : '', at: Math.max(0, +v.at || 0) };
  for (const [k, v] of Object.entries(obj(d.songs))) if (v && typeof v === 'object') s.songs[k] = { stars: clamp(+v.stars || 0, 0, 3), best: clamp(+v.best || 0, 0, 150), plays: +v.plays || 0, last: isKey(v.last) ? v.last : '', mins: +v.mins || 0 };
  for (const [k, v] of Object.entries(obj(d.skills))) if (v && typeof v === 'object') s.skills[k] = { lvl: clamp(+v.lvl || 0, 0, 6), due: isKey(v.due) ? v.due : today(), n: +v.n || 0, last: isKey(v.last) ? v.last : '', since: isKey(v.since) ? v.since : '' };
  for (const [k, v] of Object.entries(obj(d.stats))) if (Array.isArray(v) && v.length === 3) s.stats[k] = v.map(n => +n || 0);
  for (const [k, v] of Object.entries(obj(d.log))) if (isKey(k) && v && typeof v === 'object') s.log[k] = { mins: Math.max(0, +v.mins || 0), parts: obj(v.parts), sessions: +v.sessions || 0, feel: +v.feel || 0, note: String(v.note || '').slice(0, 500) };
  for (const [k, v] of Object.entries(obj(d.plans))) if (isKey(k) && v && Array.isArray(v.blocks)) s.plans[k] = v;
  for (const [k, v] of Object.entries(obj(d.badges))) if (isKey(v)) s.badges[k] = v;
  // Away from the piano (1.1): days you're away, your usual away days, away plans and theory studies.
  for (const [k, v] of Object.entries(obj(d.away))) if (isKey(k)) s.away[k] = v ? 1 : 0;
  if (Array.isArray(d.awayWeek) && d.awayWeek.length === 7) s.awayWeek = d.awayWeek.map(Boolean);
  for (const [k, v] of Object.entries(obj(d.aplans))) if (isKey(k) && v && Array.isArray(v.blocks)) s.aplans[k] = v;
  for (const [k, v] of Object.entries(obj(d.theory))) if (/^th-[a-z0-9-]+$/.test(k) && v && typeof v === 'object') s.theory[k] = { done: isKey(v.done) ? v.done : '', at: Math.max(0, Math.round(+v.at || 0)), n: Math.max(0, Math.round(+v.n || 0)), lvl: clamp(Math.round(+v.lvl || 0), 0, 6), due: isKey(v.due) ? v.due : '' };
  s.savedAt = +d.savedAt || 0;
  return s;
}
let S = freshState();
let SAVE_OK = true;
function load() {
  let raw = null;
  try { raw = localStorage.getItem(STORE_KEY); } catch (e) { SAVE_OK = false; }
  if (!raw) return freshState();
  try { return migrate(JSON.parse(raw)); } catch (e) {
    try { localStorage.setItem(`${STORE_KEY}:unreadable-${Date.now()}`, raw); } catch (_) { /* full */ }
    return freshState();
  }
}
function save() {
  S.savedAt = Date.now();
  // Keep the last 60 days of plans only.
  const cut = addDays(today(), -60);
  for (const k of Object.keys(S.plans)) if (k < cut) delete S.plans[k];
  for (const k of Object.keys(S.aplans)) if (k < cut) delete S.aplans[k];
  for (const k of Object.keys(S.away)) if (k < cut) delete S.away[k];
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); SAVE_OK = true; } catch (e) {
    SAVE_OK = false;
    toast('⚠️ Couldn’t save on this device. Storage may be full — try a backup in Settings.', { ms: 6000 });
  }
}

/* ---------- words: Australian (crotchet) or US (quarter note) ---------- */
const TERMS = {
  q: ['crotchet', 'quarter note'], qs: ['crotchets', 'quarter notes'], h: ['minim', 'half note'], hs: ['minims', 'half notes'],
  w: ['semibreve', 'whole note'], ws: ['semibreves', 'whole notes'], e: ['quaver', 'eighth note'], es: ['quavers', 'eighth notes'],
  s: ['semiquaver', 'sixteenth note'], ss: ['semiquavers', 'sixteenth notes'], dh: ['dotted minim', 'dotted half note'],
  dq: ['dotted crotchet', 'dotted quarter note'], qr: ['crotchet rest', 'quarter rest'], hr: ['minim rest', 'half rest'],
  wr: ['semibreve rest', 'whole rest'], er: ['quaver rest', 'eighth rest'], bar: ['bar', 'measure'], bars: ['bars', 'measures'],
  tone: ['tone', 'whole step'], tones: ['tones', 'whole steps'], semi: ['semitone', 'half step'], semis: ['semitones', 'half steps'],
};
const term = k => TERMS[k][S.prefs.terms === 'us' ? 1 : 0];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const T = s => String(s).replace(/\{([a-zA-Z]+)\}/g, (m, k) => (TERMS[k.toLowerCase()] ? (k[0] === k[0].toUpperCase() ? cap(term(k.toLowerCase())) : term(k)) : m));
// Rich text: {terms}, **bold**, *italic*, [[C4]] or [[C4|label]] note chips, [[chord:Am]], [[keys:C4 E4 G4|label]].
function rich(s) {
  let h = esc(T(s));
  h = h.replace(/\[\[chord:([^\]|]+)(?:\|([^\]]+))?\]\]/g, (m, sym, lab) => `<button type="button" class="chip-n" data-play-chord="${esc(sym)}">${icon('note')}${lab || pretty(sym)}</button>`);
  h = h.replace(/\[\[keys:([^\]|]+)(?:\|([^\]]+))?\]\]/g, (m, ks, lab) => `<button type="button" class="chip-n" data-play-keys="${esc(ks)}">${icon('note')}${lab || ks.split(' ').map(n => noteLabel(parsePitch(n))).join(' ')}</button>`);
  h = h.replace(/\[\[([A-G](?:#|b)?-?\d)(?:\|([^\]]+))?\]\]/g, (m, n, lab) => `<button type="button" class="chip-n" data-play-note="${n}">${icon('note')}${lab || noteLabel(parsePitch(n))}</button>`);
  h = h.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');
  return textSym(h);
}
const paras = list => (Array.isArray(list) ? list : [list]).filter(Boolean).map(p => (p.startsWith('- ') ? `<ul>${p.split('\n').map(li => `<li>${rich(li.replace(/^- /, ''))}</li>`).join('')}</ul>` : `<p>${rich(p)}</p>`)).join('');
document.addEventListener('click', e => {
  const b = e.target.closest('[data-play-note],[data-play-chord],[data-play-keys]');
  if (!b) return;
  if (b.dataset.playNote) playNote(pm(b.dataset.playNote), 1.1);
  if (b.dataset.playChord) playChord(chordPitches(b.dataset.playChord, 4).map(p => p.m), 1.6);
  if (b.dataset.playKeys) { const ms = b.dataset.playKeys.split(' ').map(pm); playChord(ms, 1.6); }
});

/* ---------- toasts ---------- */
let toastTimer = null;
function toast(msg, opts = {}) {
  const root = $('#toast-root');
  if (!root) return () => {};
  clearTimeout(toastTimer);
  root.innerHTML = '';
  const action = opts.action || (opts.undo ? { label: 'Undo', fn: opts.undo } : null);
  const el = document.createElement('div');
  el.className = 'toast' + (opts.cls ? ' ' + opts.cls : '');
  el.setAttribute('role', 'status');
  el.innerHTML = `<span>${msg}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  root.append(el);
  const hide = () => { clearTimeout(toastTimer); el.classList.add('out'); setTimeout(() => el.remove(), 250); };
  toastTimer = setTimeout(hide, opts.ms || (action ? 6000 : 2800));
  if (action) el.querySelector('button').addEventListener('click', () => { hide(); action.fn(); });
  return hide;
}

/* ---------- celebrations ---------- */
const reduceMotion = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
function confetti(n = 26) {
  if (!S.prefs.fx || reduceMotion()) return;
  const root = $('#fx-root'), W = window.innerWidth;
  const glyphs = ['♪', '♫', '★', '♬', '✦'];
  const colours = ['#2D5241', '#E28F01', '#CC7377', '#D7A0A6', '#5E8C70', '#B06F00'];
  for (let i = 0; i < n; i++) {
    const p = document.createElement('span');
    // A mix of music notes, stars, dots and paper squares, in all the app's colours.
    const kind = i % 3;
    p.className = kind === 0 ? 'fly' : kind === 1 ? 'fly dot' : 'fly sq';
    if (kind === 0) { p.textContent = glyphs[i % glyphs.length]; p.style.fontSize = `${18 + Math.random() * 16}px`; p.style.color = colours[i % colours.length]; }
    else { p.style.setProperty('--s', `${8 + Math.random() * 8}px`); p.style.background = colours[(i * 7) % colours.length]; }
    p.style.left = `${Math.random() * (W - 24)}px`;
    p.style.setProperty('--dx', `${Math.random() * 140 - 70}px`);
    p.style.setProperty('--rot', `${Math.random() * 540 - 270}deg`);
    p.style.setProperty('--dur', `${2 + Math.random() * 1.6}s`);
    p.style.setProperty('--delay', `${Math.random() * 0.5}s`);
    root.append(p);
    setTimeout(() => p.remove(), 4300);
  }
}

/* ---------- bottom sheets ---------- */
let SHEET = null;
function openSheet(html, opts = {}) {
  closeSheet(true);
  const root = $('#sheet-root');
  const back = document.createElement('div');
  back.className = 'backdrop';
  const el = document.createElement('div');
  el.className = 'sheet' + (opts.cls ? ' ' + opts.cls : '');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  if (opts.label) el.setAttribute('aria-label', opts.label);
  el.tabIndex = -1;
  root.append(back, el);
  document.body.classList.add('locked');
  const sh = {
    el, back, opts, closed: false,
    close: () => closeSheet(),
    set(content) { const top = el.scrollTop; el.innerHTML = `<div class="grab"></div>${content}`; el.scrollTop = top; if (opts.onSet) opts.onSet(sh); },
  };
  sh.set(html);
  SHEET = sh;
  back.addEventListener('click', () => closeSheet());
  el.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { e.preventDefault(); closeSheet(); return; }
    const a = e.target.closest('[data-act]');
    if (a && opts.act && opts.act[a.dataset.act] && !a.disabled) { e.preventDefault(); opts.act[a.dataset.act](a, e, sh); }
  });
  if (opts.input) el.addEventListener('input', e => opts.input(e, sh));
  if (opts.change) el.addEventListener('change', e => opts.change(e, sh));
  el.addEventListener('submit', e => { e.preventDefault(); if (opts.submit) opts.submit(e, sh); });
  el.focus({ preventScroll: true });
  if (opts.onOpen) opts.onOpen(sh);
  return sh;
}
function closeSheet(instant) {
  const sh = SHEET;
  if (!sh) return;
  SHEET = null;
  sh.closed = true;
  document.body.classList.remove('locked');
  if (sh.opts.onClose) sh.opts.onClose(sh);
  if (instant) { sh.el.remove(); sh.back.remove(); return; }
  sh.el.classList.add('closing');
  sh.back.classList.add('closing');
  setTimeout(() => { sh.el.remove(); sh.back.remove(); }, 220);
}
const sheetHead = (title, sub) => `<div class="sheet-head"><div><h2>${title}</h2>${sub ? `<p class="sub">${sub}</p>` : ''}</div><button type="button" class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>`;
function confirmSheet({ title, body, yes = 'Yes', no = 'Cancel', danger = false, onYes }) {
  openSheet(`${sheetHead(title)}<p class="lead">${body}</p>
    <div class="btn-row"><button type="button" class="btn ghost" data-close>${no}</button><button type="button" class="btn ${danger ? 'danger' : 'primary'}" data-act="yes">${yes}</button></div>`,
  { label: title, act: { yes: (a, e, sh) => { sh.close(); onYes(); } } });
}
const stepper = (name, val, label, sub) => `<div class="stepper" role="group" aria-label="${esc(label || name)}">
  <button type="button" data-act="step" data-name="${name}" data-d="-1" aria-label="Less">${icon('minus')}</button>
  <output aria-live="polite">${val}</output>${sub ? `<span class="unit">${sub}</span>` : ''}
  <button type="button" data-act="step" data-name="${name}" data-d="1" aria-label="More">${icon('plus')}</button></div>`;
const switchRow = (name, title, sub, on) => `<label class="switch-row"><span><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span><span class="switch"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><span></span></span></label>`;

/* ---------- skills, stats and badges ---------- */
const REVIEW_DAYS = [0, 1, 2, 4, 7, 14, 30];
function unlockSkill(id) { if (!S.skills[id]) S.skills[id] = { lvl: 0, due: today(), n: 0, last: '', since: today() }; }
const hasSkill = id => !!S.skills[id];
function skillResult(id, score) {
  const sk = S.skills[id];
  if (!sk) return;
  sk.n++;
  sk.last = today();
  if (score >= 0.85) sk.lvl = Math.min(6, sk.lvl + 1);
  else if (score < 0.6) sk.lvl = Math.max(0, sk.lvl - 1);
  sk.due = addDays(today(), REVIEW_DAYS[sk.lvl]);
}
function stat(key, ok, ms = 0) { const s = S.stats[key] || (S.stats[key] = [0, 0, 0]); s[0]++; if (ok) s[1]++; s[2] += Math.min(ms, 20000); }
const statAcc = key => { const s = S.stats[key]; return s && s[0] ? s[1] / s[0] : null; };
function award(id) {
  if (S.badges[id] || typeof BADGES === 'undefined') return false;
  const b = BADGES.find(x => x.id === id);
  if (!b) return false;
  S.badges[id] = today();
  setTimeout(() => { toast(`${b.e} Badge earned: <b>${esc(b.name)}</b>`, { ms: 4200, cls: 'gold' }); confetti(18); }, 600);
  return true;
}

/* ---------- practice time ---------- */
// Counts time spent on practice screens (only while the app is open and you've touched it in the last 2 minutes).
const TRACK = { kind: null, ref: null, last: 0, act: 0, timer: null };
function trackStart(kind, ref) {
  trackStop();
  Object.assign(TRACK, { kind, ref, last: performance.now(), act: performance.now() });
  TRACK.timer = setInterval(trackTick, 5000);
}
function trackTick(final) {
  if (!TRACK.kind) return;
  const now = performance.now();
  const ok = !document.hidden && now - TRACK.act < 120000;
  const secs = (now - TRACK.last) / 1000;
  TRACK.last = now;
  if (ok && secs > 0 && secs < 30) addPractice(TRACK.kind, secs / 60, TRACK.ref);
  if (final !== true && Math.random() < 0.34) save();
}
function trackStop() {
  if (!TRACK.kind) return;
  trackTick(true);
  clearInterval(TRACK.timer);
  TRACK.kind = null;
  save();
}
['pointerdown', 'keydown'].forEach(t => document.addEventListener(t, () => { TRACK.act = performance.now(); }, { capture: true, passive: true }));
if (typeof onInput === 'function') onInput(() => { TRACK.act = performance.now(); });
document.addEventListener('visibilitychange', () => { if (TRACK.kind) { if (document.hidden) trackTick(true); else TRACK.last = performance.now(); } });
function addPractice(kind, mins, ref) {
  const d = today();
  const lg = S.log[d] || (S.log[d] = { mins: 0, parts: {}, sessions: 0, feel: 0, note: '' });
  lg.mins += mins;
  lg.parts[kind] = (lg.parts[kind] || 0) + mins;
  if (kind === 'song' && ref && S.songs[ref]) S.songs[ref].mins += mins;
  if (typeof onPracticeTime === 'function') onPracticeTime(kind, mins, ref);
}
const minsOn = d => (S.log[d] ? S.log[d].mins : 0);
const plannedFor = d => (d in S.over ? S.over[d] : S.week[dowOf(d)]);

/* ---------- router ---------- */
const VIEWS = {};
const UI = { cleanup: null, cur: null, param: '' };
function route() {
  const parts = (location.hash || '').replace(/^#\/?/, '').split('/');
  const name = VIEWS[parts[0]] ? parts[0] : 'today';
  return { name, param: decodeURIComponent(parts.slice(1).join('/')) };
}
function go(hash) { if (location.hash === hash) render(true); else location.hash = hash; }
function render(fresh) {
  const { name, param } = route();
  if (name !== UI.cur || param !== UI.param) fresh = true;
  if (fresh && UI.cleanup) { try { UI.cleanup(); } catch (e) { console.error(e); } UI.cleanup = null; }
  if (fresh) { hush(); trackStop(); }
  UI.cur = name;
  UI.param = param;
  const v = VIEWS[name];
  const view = $('#view');
  document.body.classList.toggle('stage', !!(v.stage && v.stage(param)));
  view.classList.remove('view-in');
  const keep = !fresh ? window.scrollY : 0;
  view.innerHTML = v.render(param);
  if (fresh) { void view.offsetWidth; view.classList.add('view-in'); window.scrollTo(0, 0); } else window.scrollTo(0, keep);
  if (v.after) { const c = v.after(view, param); if (fresh || c) UI.cleanup = c || UI.cleanup; }
  const tabName = v.tab || name;
  for (const t of $$('.tab')) {
    const on = t.dataset.tab === tabName;
    t.classList.toggle('active', on);
    if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  }
  document.title = name === 'today' ? 'Crescendo' : `${v.title} · Crescendo`;
}
function onViewClick(e) {
  const a = e.target.closest('[data-act]');
  if (!a || a.disabled || !$('#view').contains(a) || a.closest('[data-local]')) return;
  const v = VIEWS[UI.cur];
  const fn = v && v.act && v.act[a.dataset.act];
  if (fn) { e.preventDefault(); fn(a, e); }
}
