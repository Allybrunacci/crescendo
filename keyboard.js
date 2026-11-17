/* Crescendo — an on-screen piano keyboard (SVG). Multi-touch, slides between keys, marks keys for teaching. */
'use strict';

// Black-key centres, in white-key widths from the C at the start of the octave.
const BLACK_X = { 1: 0.93, 3: 2.08, 6: 3.91, 8: 5.0, 10: 6.1 };
const WHITE_INDEX = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };

function createKeyboard(host, opts = {}) {
  let from = snapDown(typeof opts.from === 'string' ? pm(opts.from) : opts.from || 48);
  let to = snapUp(typeof opts.to === 'string' ? pm(opts.to) : opts.to || 72);
  const marks = new Map(); // m -> { cls:Set, text }
  const active = new Map(); // pointerId -> m
  const pressed = new Set();
  const wrap = document.createElement('div');
  wrap.className = 'kb-wrap' + (opts.cls ? ' ' + opts.cls : '');
  host.innerHTML = '';
  host.append(wrap);
  let svg = null, ww = 30;

  function snapDown(m) { while (isBlack(m)) m--; return m; }
  function snapUp(m) { while (isBlack(m)) m++; return m; }
  function whites() { let n = 0; for (let m = from; m <= to; m++) if (!isBlack(m)) n++; return n; }
  function xOf(m) {
    const oct = Math.floor(m / 12), pc = mod(m, 12);
    const base = (oct - Math.floor(from / 12)) * 7 - WHITE_INDEX[mod(from, 12)];
    return isBlack(m) ? (base + BLACK_X[pc]) * ww : (base + WHITE_INDEX[pc]) * ww;
  }
  function draw() {
    const n = whites();
    const avail = (host.clientWidth || opts.width || 340);
    ww = Math.max(opts.minWhite || 22, Math.min(opts.maxWhite || 64, avail / n));
    const W = n * ww, H = opts.height || Math.round(Math.min(150, Math.max(92, ww * 4.3)));
    const bw = ww * 0.6, bh = H * 0.62;
    const lab = opts.labels || 'c';
    let wk = '', bk = '', tx = '';
    for (let m = from; m <= to; m++) {
      const x = xOf(m);
      if (isBlack(m)) {
        bk += `<rect class="k b" data-m="${m}" x="${fx(x - bw / 2)}" y="0" width="${fx(bw)}" height="${fx(bh)}" rx="${fx(ww * 0.08)}"/>`;
      } else {
        wk += `<rect class="k w" data-m="${m}" x="${fx(x + 0.5)}" y="0" width="${fx(ww - 1)}" height="${H}" rx="${fx(ww * 0.12)}"/>`;
        const pc = mod(m, 12);
        if (lab === 'all' || (lab === 'c' && pc === 0)) tx += `<text class="kl${m === 60 ? ' mc' : ''}" x="${fx(x + ww / 2)}" y="${fx(H - 8)}">${LETTERS[WHITE_INDEX[pc]]}${lab === 'c' || opts.octaves ? `<tspan class="oct">${Math.floor(m / 12) - 1}</tspan>` : ''}</text>`;
        if (m === 60 && opts.middleC !== false) tx += `<circle class="mcdot" cx="${fx(x + ww / 2)}" cy="${fx(H - (lab === 'none' ? 10 : 26))}" r="${fx(Math.max(2.5, ww * 0.09))}"/>`;
      }
    }
    wrap.innerHTML = `<svg class="kb" viewBox="0 0 ${fx(W)} ${H}" width="${fx(W)}" height="${H}" role="group" aria-label="Piano keyboard">
      <g class="wk">${wk}</g><g class="tx">${tx}</g><g class="bk">${bk}</g><g class="badges"></g></svg>`;
    svg = wrap.firstElementChild;
    wrap.style.overflowX = W > avail + 1 ? 'auto' : 'hidden';
    paint();
  }
  function keyEl(m) { return svg && svg.querySelector(`[data-m="${m}"]`); }
  function paint() {
    if (!svg) return;
    svg.querySelectorAll('.k').forEach(k => { k.setAttribute('class', `k ${isBlack(+k.dataset.m) ? 'b' : 'w'}`); });
    const H = +svg.getAttribute('height');
    let badges = '';
    for (const [m, mk] of marks) {
      const k = keyEl(m);
      if (!k) continue;
      mk.cls.forEach(c => k.classList.add(c));
      if (mk.text !== undefined && mk.text !== '') {
        const bx = xOf(m) + (isBlack(m) ? 0 : ww / 2), by = isBlack(m) ? H * 0.62 - ww * 0.42 : H - ww * 0.42 - (opts.labels === 'none' ? 4 : 22);
        badges += `<g class="badge${isBlack(m) ? ' on-b' : ''}"><circle cx="${fx(bx)}" cy="${fx(by)}" r="${fx(Math.max(8, ww * 0.3))}"/><text x="${fx(bx)}" y="${fx(by)}">${esc(mk.text)}</text></g>`;
      }
    }
    pressed.forEach(m => { const k = keyEl(m); if (k) k.classList.add('down'); });
    svg.querySelector('.badges').innerHTML = badges;
  }
  const keyAt = (x, y) => { const el = document.elementFromPoint(x, y); const k = el && el.closest ? el.closest('.kb [data-m]') : null; return k && wrap.contains(k) ? +k.dataset.m : null; };
  function down(m) {
    if (m === null || m === undefined) return;
    if (opts.onDown && opts.onDown(m) === false) return;
    if (opts.emit !== false) emitInput('on', m, 0.72, 'touch'); else noteOn(m, 0.72);
    setPressed(m, true);
  }
  function up(m) {
    if (m === null || m === undefined) return;
    if (opts.emit !== false) emitInput('off', m, 0, 'touch'); else noteOff(m);
    setPressed(m, false);
    if (opts.onUp) opts.onUp(m);
  }
  function setPressed(m, on) {
    if (on) pressed.add(m); else pressed.delete(m);
    const k = keyEl(m);
    if (k) k.classList.toggle('down', on);
  }
  wrap.addEventListener('pointerdown', e => {
    const k = e.target.closest('[data-m]');
    if (!k || opts.readOnly) return;
    e.preventDefault();
    const m = +k.dataset.m;
    active.set(e.pointerId, m);
    down(m);
  });
  wrap.addEventListener('pointermove', e => {
    if (!active.has(e.pointerId) || opts.noSlide) return;
    const m = keyAt(e.clientX, e.clientY), old = active.get(e.pointerId);
    if (m === old || m === null) return;
    up(old);
    active.set(e.pointerId, m);
    down(m);
  });
  const end = e => { if (!active.has(e.pointerId)) return; up(active.get(e.pointerId)); active.delete(e.pointerId); };
  wrap.addEventListener('pointerup', end);
  wrap.addEventListener('pointercancel', end);
  wrap.addEventListener('lostpointercapture', end);
  wrap.addEventListener('contextmenu', e => e.preventDefault());
  // Show notes coming in from a MIDI keyboard, the computer keyboard or the microphone.
  const unsub = opts.mirror === false ? () => {} : onInput(ev => {
    if (ev.src === 'touch') return;
    if (ev.m < from || ev.m > to) return;
    setPressed(ev.m, ev.type === 'on');
    if (ev.type === 'on' && ev.src === 'mic') setTimeout(() => setPressed(ev.m, false), 260);
  });
  let lastW = 0;
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { const w = host.clientWidth; if (w && Math.abs(w - lastW) > 2) { lastW = w; draw(); } }) : null;
  if (ro) ro.observe(host);
  draw();
  return {
    el: wrap,
    get from() { return from; },
    get to() { return to; },
    mark(m, cls, text) {
      const ms = Array.isArray(m) ? m : [m];
      ms.forEach((x, j) => {
        const mk = marks.get(x) || { cls: new Set() };
        mk.cls.add(cls);
        if (text !== undefined) mk.text = Array.isArray(text) ? text[j] : text;
        marks.set(x, mk);
      });
      paint();
    },
    unmark(m, cls) {
      (Array.isArray(m) ? m : [m]).forEach(x => { const mk = marks.get(x); if (!mk) return; mk.cls.delete(cls); if (!mk.cls.size) marks.delete(x); });
      paint();
    },
    clear(cls) {
      if (!cls) marks.clear();
      else for (const [m, mk] of [...marks]) { mk.cls.delete(cls); if (!mk.cls.size) marks.delete(m); }
      paint();
    },
    flash(m, cls, ms = 450) {
      this.mark(m, cls);
      setTimeout(() => this.unmark(m, cls), ms);
    },
    setRange(a, b) {
      from = snapDown(typeof a === 'string' ? pm(a) : a);
      to = snapUp(typeof b === 'string' ? pm(b) : b);
      draw();
    },
    // Fits the range to some notes, with a little room either side.
    fit(ms, pad = 2) {
      if (!ms.length) return;
      let a = Math.min(...ms) - pad, b = Math.max(...ms) + pad;
      const pa = mod(a, 12), pb = mod(b, 12);
      a -= pa >= 5 ? pa - 5 : pa; // down to an F or a C
      b += pb <= 4 ? 4 - pb : 11 - pb; // up to an E or a B
      this.setRange(a, b);
    },
    scrollTo(m) {
      if (wrap.scrollWidth <= wrap.clientWidth) return;
      wrap.scrollLeft = Math.max(0, xOf(m) - wrap.clientWidth / 2);
    },
    redraw: draw,
    destroy() { unsub(); if (ro) ro.disconnect(); for (const m of [...pressed]) up(m); },
  };
}
