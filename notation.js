/* Crescendo — draws music notation as SVG with “Crescendo Notation”, a renamed subset of Bravura (SIL OFL 1.1).
   Layout is in staff spaces (sp); 1 sp = 10 SVG units. SMuFL glyphs: the em is 4 sp. */
'use strict';

const NSP = 10;
const GL = {
  brace: '\uE000', gClef: '\uE050', fClef: '\uE062', whole: '\uE0A2', half: '\uE0A3', black: '\uE0A4', dot: '\uE1E7',
  f8u: '\uE240', f8d: '\uE241', f16u: '\uE242', f16d: '\uE243', flat: '\uE260', natural: '\uE261', sharp: '\uE262',
  accentA: '\uE4A0', accentB: '\uE4A1', staccA: '\uE4A2', staccB: '\uE4A3', rw: '\uE4E3', rh: '\uE4E4', rq: '\uE4E5', re: '\uE4E6', rs: '\uE4E7',
  p: '\uE520', m: '\uE521', f: '\uE522', metQ: '\uECA5', metH: '\uECA3', metE: '\uECA7',
};
const tsGlyph = n => String(n).split('').map(d => String.fromCharCode(0xE080 + +d)).join('');
const fingGlyph = n => String.fromCharCode(0xED10 + n);
const DYN_GLYPH = { p: 'p', pp: 'pp', mp: 'mp', mf: 'mf', f: 'f', ff: 'ff' };
const HEAD_W = { w: 1.688, h: 1.18, q: 1.18, e: 1.18, s: 1.18 };
const REST_W = { w: 1.128, h: 1.128, q: 1.08, e: 0.988, s: 1.28 };
const ACC_W = { '-1': 0.904, 0: 0.672, 1: 0.996, '-2': 0.904, 2: 0.996 };
const ACC_GLYPH = { '-1': GL.flat, 0: GL.natural, 1: GL.sharp, '-2': GL.flat, 2: GL.sharp };
const KEY_POS = {
  treble: { s: [4, 1, 5, 2, -1, 3, 0], f: [0, 3, -1, 2, -2, 1, -3] },
  bass: { s: [2, -1, 3, 0, -3, 1, -2], f: [-2, 1, -3, 0, -4, -1, -5] },
};
const fx = n => Math.round(n * 100) / 100;

function engrave(host, spec) {
  const staves = spec.staves.map(s => ({ clef: s.clef || 'treble', hand: s.hand, events: s.events || [] }));
  const ns = staves.length;
  const key = spec.key || 'C';
  const kAcc = keyAcc(key), kN = staves[0].clef === 'rhythm' ? 0 : KEY_SIGS[key] || 0;
  const time = spec.time ? parseTime(spec.time) : null;
  const scale = spec.scale || 8;
  const widthPx = spec.width || host.clientWidth || 340;
  const avail = widthPx / scale - 0.4;
  const lastEnd = Math.max(0, ...staves.map(s => (s.events.length ? s.events[s.events.length - 1].t + s.events[s.events.length - 1].d : 0)));
  const bars = (spec.bars && spec.bars.length ? spec.bars : [{ start: 0, len: lastEnd }]).map(b => ({ ...b }));
  const barOf = t => { for (let b = bars.length - 1; b >= 0; b--) if (t >= bars[b].start - 1e-9) return b; return 0; };

  /* ---- per-event info: positions, accidentals, stems, beams ---- */
  staves.forEach(st => {
    let barIdx = -1, barAcc = {};
    st.info = st.events.map(ev => {
      const b = barOf(ev.t);
      if (b !== barIdx) { barIdx = b; barAcc = {}; }
      const pos = ev.ps.map(p => (st.clef === 'rhythm' ? 0 : staffPos(p, st.clef)));
      const acc = ev.ps.map(p => {
        if (ev.rest || ev.hit || st.clef === 'rhythm') return null;
        const k = p.L + p.o, cur = k in barAcc ? barAcc[k] : kAcc[p.L] || 0;
        barAcc[k] = p.a;
        if (ev.tied) return null; // a tied note keeps its accidental without repeating it
        return p.a !== cur ? p.a : null;
      });
      const lo = pos.length ? Math.min(...pos) : 0, hi = pos.length ? Math.max(...pos) : 0;
      return { bar: b, pos, acc, lo, hi, up: st.clef === 'rhythm' ? true : hi + lo < 0, beam: -1, flag: ['e', 's'].includes(ev.base) };
    });
    // Beams: quavers/semiquavers within the same beat (or dotted-crotchet group in 6/8).
    const grp = time ? time.group : 1;
    st.beams = [];
    let cur = [];
    const flush = () => { if (cur.length > 1) st.beams.push(cur); cur = []; };
    st.events.forEach((ev, i) => {
      const inf = st.info[i];
      if (ev.rest || !inf.flag) { flush(); return; }
      const g = Math.floor((ev.t - bars[inf.bar].start + 1e-6) / grp);
      if (cur.length) {
        const p = st.events[cur[cur.length - 1]], pi = st.info[cur[cur.length - 1]];
        if (pi.bar !== inf.bar || Math.floor((p.t - bars[pi.bar].start + 1e-6) / grp) !== g || Math.abs(p.t + p.d - ev.t) > 1e-6) flush();
      }
      cur.push(i);
    });
    flush();
    st.beams.forEach((g, gi) => {
      const lo = Math.min(...g.map(i => st.info[i].lo)), hi = Math.max(...g.map(i => st.info[i].hi));
      const up = st.clef === 'rhythm' ? true : hi + lo < 0;
      g.forEach(i => { st.info[i].beam = gi; st.info[i].up = up; st.info[i].flag = false; });
    });
    // Heads a second apart sit on opposite sides of the stem.
    st.info.forEach((inf, i) => {
      const ev = st.events[i];
      inf.disp = inf.pos.map(() => 0);
      inf.accX = inf.acc.map(() => 0);
      if (ev.rest || inf.pos.length < 2) return;
      const order = inf.pos.map((p, j) => [p, j]).sort((a, b) => a[0] - b[0]);
      if (inf.up) {
        for (let k = 1; k < order.length; k++) if (order[k][0] - order[k - 1][0] === 1 && !inf.disp[order[k - 1][1]]) inf.disp[order[k][1]] = 1;
      } else {
        for (let k = order.length - 2; k >= 0; k--) if (order[k + 1][0] - order[k][0] === 1 && !inf.disp[order[k + 1][1]]) inf.disp[order[k][1]] = -1;
      }
      // Accidental columns, top to bottom.
      let col = 0, lastPos = null;
      order.slice().reverse().forEach(([p, j]) => {
        if (inf.acc[j] === null) return;
        if (lastPos !== null && lastPos - p < 6) col += 1; else col = 0;
        inf.accX[j] = col;
        lastPos = p;
      });
    });
  });

  /* ---- columns: everything that starts at the same moment in a bar ---- */
  const ideal = d => 1.1 + 3.0 * Math.pow(Math.max(d, 0.25), 0.6);
  const barCols = bars.map((bar, b) => {
    const m = new Map();
    staves.forEach((st, s) => st.events.forEach((ev, i) => {
      if (st.info[i].bar !== b) return;
      const k = Math.round((ev.t - bar.start) * 1e4);
      if (!m.has(k)) m.set(k, { t: ev.t, items: [] });
      m.get(k).items.push([s, i]);
    }));
    const cols = [...m.values()].sort((a, c) => a.t - c.t);
    cols.forEach((c, j) => {
      let lw = 0, rw = 0;
      for (const [s, i] of c.items) {
        const ev = staves[s].events[i], inf = staves[s].info[i];
        if (ev.rest) { rw = Math.max(rw, REST_W[ev.base]); continue; }
        const hw = HEAD_W[ev.base];
        let left = 0, right = hw;
        if (inf.disp.includes(1)) right += hw;
        if (inf.disp.includes(-1)) left += hw;
        const accs = inf.acc.map((a, j2) => (a === null ? 0 : ACC_W[a] + inf.accX[j2] * 1.1)).filter(Boolean);
        if (accs.length) left += Math.max(...accs) + 0.25;
        if (ev.dots) right += 0.85;
        if (inf.flag && inf.up) right = Math.max(right, hw + 1.1);
        lw = Math.max(lw, left);
        rw = Math.max(rw, right);
      }
      c.lw = lw;
      c.rw = rw;
      c.gap = (j + 1 < cols.length ? cols[j + 1].t : bar.start + bar.len) - c.t;
    });
    let x = 1.2 + (cols[0] ? cols[0].lw : 0);
    cols.forEach((c, j) => {
      c.rel = x;
      const next = cols[j + 1];
      c.ideal = ideal(c.gap);
      c.space = next ? Math.max(c.ideal, c.rw + next.lw + 0.5) : Math.max(c.ideal - 0.9, c.rw + 0.7);
      x += c.space;
    });
    bar.natW = cols.length ? x : 4;
    return cols;
  });

  /* ---- lines ---- */
  const clefW = spec.showClef === false ? 0 : staves[0].clef === 'rhythm' ? 1.6 : 2.8;
  const keyW = kN ? Math.abs(kN) * 1.05 + 0.5 : 0;
  const timeW = time && spec.showTime !== false ? 2.6 : 0;
  const braceW = ns > 1 ? 1.2 : 0;
  const preW = first => 0.3 + braceW + (clefW ? clefW + 0.9 : 0.4) + keyW + (first ? timeW : 0);
  const maxBars = spec.maxBars || 4;
  const lines = [];
  let cur = null;
  bars.forEach((bar, b) => {
    if (!cur) cur = { bars: [], pre: preW(true), w: preW(true) };
    // Squeeze a little rather than leave a bar on its own.
    if (cur.bars.length && (cur.w + bar.natW > avail * 1.07 || cur.bars.length >= maxBars)) {
      lines.push(cur);
      cur = { bars: [], pre: preW(false), w: preW(false) };
    }
    cur.bars.push(b);
    cur.w += bar.natW;
  });
  if (cur) lines.push(cur);
  lines.forEach((ln, li) => {
    const last = li === lines.length - 1;
    let target = avail;
    if (spec.center) target = ln.w;
    else if (last && !spec.fill) target = Math.min(avail, lines.length > 1 ? Math.max(ln.w, avail * 0.98) : ln.w * 1.5);
    if (last && lines.length > 1 && ln.w < avail * 0.6 && !spec.fill) target = Math.min(avail, ln.w * 1.25);
    const cols = ln.bars.flatMap(b => barCols[b]);
    const tot = cols.reduce((a, c) => a + c.ideal, 0) || 1;
    const emptyBars = ln.bars.filter(b => !barCols[b].length).length;
    const extra = target - ln.w;
    let x = ln.pre;
    ln.bars.forEach(b => {
      const bar = bars[b], cs = barCols[b];
      bar.x = x;
      if (!cs.length) { bar.w = bar.natW + (cols.length ? 0 : extra / Math.max(1, emptyBars)); x += bar.w; return; }
      let bx = cs[0].rel;
      cs.forEach(c => { c.x = x + bx; c.w = c.space + (extra * c.ideal) / tot; bx += c.w; });
      bar.w = bx;
      x += bx;
    });
    ln.end = x;
  });
  const offX = spec.center ? Math.max(0, (avail - Math.max(...lines.map(l => l.end))) / 2) : 0;

  /* ---- vertical layout ---- */
  const hasRow = (ln, test) => ln.bars.some(b => barCols[b].some(c => c.items.some(([s, i]) => test(staves[s].events[i], s))));
  lines.forEach((ln, li) => {
    ln.st = staves.map((st, s) => {
      let top = 2, bot = -2;
      ln.bars.forEach(b => barCols[b].forEach(c => c.items.forEach(([s2, i]) => {
        if (s2 !== s) return;
        const ev = st.events[i], inf = st.info[i];
        if (ev.rest) return;
        top = Math.max(top, inf.hi / 2 + 0.6 + (inf.up ? 3.5 : 0));
        bot = Math.min(bot, inf.lo / 2 - 0.6 - (inf.up ? 0 : 3.5));
      })));
      const fingN = spec.fingers === false ? 0 : Math.max(0, ...ln.bars.map(b => Math.max(0, ...barCols[b].map(c => Math.max(0, ...c.items.filter(([s2]) => s2 === s).map(([, i]) => { const ev = st.events[i]; return ev.fing && !ev.rest ? ev.fing.filter(Boolean).length : 0; }))))));
      const dyn = hasRow(ln, (ev, s2) => s2 === s && ev.dyn);
      const fingH = fingN ? 0.7 + fingN * 1.25 : 0;
      const above = Math.max(0, top - 2) + (st.hand !== 'L' ? fingH : 0);
      const below = Math.max(0, -2 - bot) + (st.hand === 'L' ? fingH : 0) + (spec.labels ? 2.1 : 0) + (dyn ? 2.6 : 0);
      return { above, below };
    });
    const chords = spec.chords !== false && hasRow(ln, ev => ev.chord);
    ln.topPad = 0.6 + (chords ? 2.6 : 0) + (li === 0 && spec.tempo ? 2.4 : 0) + (li > 0 ? 0.6 : 0);
  });
  let y = 0;
  lines.forEach(ln => {
    ln.y = y;
    let sy = y + ln.topPad + ln.st[0].above;
    ln.staffY = [];
    ln.st.forEach((m, s) => {
      if (s > 0) sy += Math.max(3, ln.st[s - 1].below + m.above + 1.6);
      ln.staffY.push(sy);
      sy += 4;
    });
    ln.h = sy + ln.st[ns - 1].below + 1.2 - y;
    y += ln.h;
  });
  const totalH = y;

  /* ---- drawing ---- */
  const U = v => fx(v * NSP);
  const out = [], glyph = [], text = [], evGroups = [];
  const T = (x, yy, ch, extra = '') => `<text x="${U(x + offX)}" y="${U(yy)}"${extra}>${ch}</text>`;
  const line = (x1, y1, x2, y2, w) => `<path d="M${U(x1 + offX)} ${U(y1)}L${U(x2 + offX)} ${U(y2)}" stroke="currentColor" stroke-width="${U(w)}"/>`;
  const rect = (x, yy, w, h) => `<rect x="${U(x + offX)}" y="${U(yy)}" width="${U(w)}" height="${U(h)}"/>`;
  const curve = (x1, y1, x2, y2, dir) => {
    const dx = x2 - x1, h = Math.min(2.2, Math.max(0.7, dx * 0.14)) * dir, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return `<path class="tie" d="M${U(x1 + offX)} ${U(y1)}Q${U(mx + offX)} ${U(my + h)} ${U(x2 + offX)} ${U(y2)}Q${U(mx + offX)} ${U(my + h * 0.72)} ${U(x1 + offX)} ${U(y1)}Z"/>`;
  };
  const evPos = {};
  lines.forEach((ln, li) => {
    const first = li === 0;
    const sys0 = ln.staffY[0], sys1 = ln.staffY[ns - 1] + 4;
    staves.forEach((st, s) => {
      const top = ln.staffY[s];
      if (st.clef === 'rhythm') out.push(line(0.3 + braceW, top + 2, ln.end, top + 2, 0.13));
      else for (let k = 0; k < 5; k++) out.push(line(0.3 + braceW, top + k, ln.end, top + k, 0.13));
      let x = 0.3 + braceW + 0.5;
      if (clefW) {
        if (st.clef === 'treble') glyph.push(T(x, top + 3, GL.gClef));
        else if (st.clef === 'bass') glyph.push(T(x, top + 1, GL.fClef));
        else out.push(rect(x + 0.3, top + 1, 0.4, 2), rect(x + 1.0, top + 1, 0.4, 2));
        x += clefW + 0.4;
      }
      if (kN && st.clef !== 'rhythm') {
        const pl = KEY_POS[st.clef][kN > 0 ? 's' : 'f'];
        for (let k = 0; k < Math.abs(kN); k++) glyph.push(T(x + k * 1.05, top + 2 - pl[k] / 2, kN > 0 ? GL.sharp : GL.flat));
        x += keyW;
      }
      if (first && timeW) {
        glyph.push(T(x + 0.1, top + 1, tsGlyph(time.num)), T(x + 0.1, top + 3, tsGlyph(time.den)));
      }
    });
    if (ns > 1) {
      const h = sys1 - sys0;
      glyph.push(`<text x="${U(0.2 + offX)}" y="${U(sys1)}" transform="translate(0 ${U(sys1)}) scale(1 ${fx(h / 4)}) translate(0 ${-U(sys1)})">${GL.brace}</text>`);
      out.push(line(0.3 + braceW, sys0, 0.3 + braceW, sys1, 0.16));
    }
    if (li > 0 && spec.barNumbers !== false && bars.length > 2) text.push(`<text class="bn" x="${U(0.4 + offX)}" y="${U(sys0 - 1.2)}">${ln.bars[0] + 1}</text>`);
    if (first && spec.tempo) {
      glyph.push(`<text x="${U(ln.pre + offX)}" y="${U(ln.y + 2.1)}" font-size="${U(3)}">${GL.metQ}</text>`);
      text.push(`<text class="tm" x="${U(ln.pre + 1.9 + offX)}" y="${U(ln.y + 2.1)}">= ${spec.tempo}</text>`);
    }
    // Bar lines.
    ln.bars.forEach((b, k) => {
      const bar = bars[b], xe = bar.x + bar.w;
      const isLast = b === bars.length - 1;
      const groups = ns > 1 ? [[sys0, sys1]] : [[ln.staffY[0] + (staves[0].clef === 'rhythm' ? 1 : 0), ln.staffY[0] + (staves[0].clef === 'rhythm' ? 3 : 4)]];
      if (isLast && spec.final !== false) {
        groups.forEach(([a, z]) => { out.push(line(xe - 1.0, a, xe - 1.0, z, 0.16)); out.push(rect(xe - 0.5, a, 0.5, z - a)); });
      } else if (!(isLast && spec.final === false) && (k < ln.bars.length - 1 || !isLast)) {
        groups.forEach(([a, z]) => out.push(line(xe - 0.08, a, xe - 0.08, z, 0.16)));
      }
    });
    // Events.
    ln.bars.forEach(b => barCols[b].forEach(c => c.items.forEach(([s, i]) => {
      const st = staves[s], ev = st.events[i], inf = st.info[i], top = ln.staffY[s];
      evPos[`${s}:${i}`] = { x: c.x, line: li, top };
      inf.x = c.x;
      inf.top = top;
      inf.line = li;
    })));
  });

  // Beam geometry first, so beamed stems end on the beam.
  staves.forEach(st => st.beams.forEach(g => {
    const inf0 = st.info[g[0]], up = inf0.up;
    if (g.some(i => st.info[i].line !== inf0.line)) { g.forEach(i => { st.info[i].beam = -1; st.info[i].flag = true; }); return; }
    const yOf = (inf, p) => inf.top + 2 - p / 2;
    const pts = g.map(i => {
      const inf = st.info[i], ev = st.events[i];
      const sx = up ? inf.x + HEAD_W[ev.base] - 0.06 : inf.x + 0.06;
      const ny = up ? yOf(inf, inf.hi) : yOf(inf, inf.lo);
      return { sx, ideal: up ? ny - 3.4 : ny + 3.4, min: up ? ny - 2.6 : ny + 2.6 };
    });
    const n = pts.length, x0 = pts[0].sx, x1 = pts[n - 1].sx;
    let slope = x1 > x0 ? (pts[n - 1].ideal - pts[0].ideal) / (x1 - x0) : 0;
    slope = Math.max(-0.18, Math.min(0.18, slope));
    let b0 = up ? Math.min(...pts.map(p => p.ideal - slope * (p.sx - x0))) : Math.max(...pts.map(p => p.ideal - slope * (p.sx - x0)));
    pts.forEach(p => { const yb = b0 + slope * (p.sx - x0); if (up && yb > p.min) b0 -= yb - p.min; if (!up && yb < p.min) b0 += p.min - yb; });
    g.forEach((i, k) => { st.info[i].stemEnd = b0 + slope * (pts[k].sx - x0); });
    const th = up ? 0.5 : -0.5;
    const yA = b0, yB = b0 + slope * (x1 - x0);
    out.push(`<path class="beam" d="M${U(x0 - 0.06 + offX)} ${U(yA)}L${U(x1 + 0.06 + offX)} ${U(yB)}L${U(x1 + 0.06 + offX)} ${U(yB + th)}L${U(x0 - 0.06 + offX)} ${U(yA + th)}Z"/>`);
    // Second beam for semiquavers.
    for (let k = 0; k < n; k++) {
      if (st.events[g[k]].base !== 's') continue;
      const off = up ? 0.75 : -0.75;
      const nextS = k + 1 < n && st.events[g[k + 1]].base === 's';
      const prevS = k > 0 && st.events[g[k - 1]].base === 's';
      if (nextS) {
        const xa = pts[k].sx, xb = pts[k + 1].sx, ya = b0 + slope * (xa - x0) + off, yb2 = b0 + slope * (xb - x0) + off;
        out.push(`<path class="beam" d="M${U(xa - 0.06 + offX)} ${U(ya)}L${U(xb + 0.06 + offX)} ${U(yb2)}L${U(xb + 0.06 + offX)} ${U(yb2 + th)}L${U(xa - 0.06 + offX)} ${U(ya + th)}Z"/>`);
      } else if (!prevS) {
        const xa = pts[k].sx, xb = k > 0 ? xa - 1.1 : xa + 1.1, ya = b0 + slope * (xa - x0) + off, yb2 = b0 + slope * (xb - x0) + off;
        out.push(`<path class="beam" d="M${U(xa + offX)} ${U(ya)}L${U(xb + offX)} ${U(yb2)}L${U(xb + offX)} ${U(yb2 + th)}L${U(xa + offX)} ${U(ya + th)}Z"/>`);
      }
    }
  }));

  // Notes, rests and everything attached to them.
  staves.forEach((st, s) => st.events.forEach((ev, i) => {
    const inf = st.info[i];
    if (inf.x === undefined) return;
    const top = inf.top, x = inf.x, yOf = p => top + 2 - p / 2;
    const parts = [];
    if (ev.rest) {
      const bar = bars[inf.bar];
      const whole = ev.d >= bar.len - 1e-6 && st.events.filter(e2 => barOf(e2.t) === inf.bar).length === 1;
      if (whole) parts.push(T(bar.x + bar.w / 2 - 0.7, yOf(2), GL.rw));
      else parts.push(T(x, yOf(ev.base === 'w' ? 2 : 0), GL['r' + ev.base]));
      if (ev.dots && !whole) parts.push(T(x + REST_W[ev.base] + 0.3, yOf(1), GL.dot));
    } else {
      const hw = HEAD_W[ev.base];
      const head = ev.base === 'w' ? GL.whole : ev.base === 'h' ? GL.half : GL.black;
      // An invisible target over the note and its staff, so a fingertip can tap it.
      const hy0 = Math.min(top - 1.2, yOf(inf.hi) - 1.2), hy1 = Math.max(top + 5.2, yOf(inf.lo) + 1.2);
      parts.push(`<rect class="hit" x="${U(x - 0.8 + offX)}" y="${U(hy0)}" width="${U(hw + 1.6)}" height="${U(hy1 - hy0)}" fill="transparent"/>`);
      // Ledger lines.
      const minX = x + (inf.disp.includes(-1) ? -hw : 0) - 0.4, maxX = x + hw + (inf.disp.includes(1) ? hw : 0) + 0.4;
      if (st.clef !== 'rhythm') {
        for (let p = 6; p <= inf.hi; p += 2) parts.push(line(minX, yOf(p), maxX, yOf(p), 0.16));
        for (let p = -6; p >= inf.lo; p -= 2) parts.push(line(minX, yOf(p), maxX, yOf(p), 0.16));
      }
      inf.pos.forEach((p, j) => {
        const hx = x + inf.disp[j] * hw;
        parts.push(T(hx, yOf(p), head));
        if (inf.acc[j] !== null) parts.push(T(x - (inf.disp.includes(-1) ? hw : 0) - 0.25 - ACC_W[inf.acc[j]] - inf.accX[j] * 1.1, yOf(p), ACC_GLYPH[inf.acc[j]]));
        if (ev.dots) parts.push(T(x + hw + (inf.disp.includes(1) ? hw : 0) + 0.35, yOf(p % 2 === 0 ? p + 1 : p), GL.dot));
      });
      if (ev.base !== 'w') {
        const up = inf.up, sx = up ? x + hw - 0.06 : x + 0.06;
        const y0 = up ? yOf(inf.lo) - 0.17 : yOf(inf.hi) + 0.17;
        let y1 = inf.stemEnd;
        if (y1 === undefined) {
          y1 = up ? yOf(inf.hi) - 3.5 : yOf(inf.lo) + 3.5;
          if (st.clef !== 'rhythm') { if (up && inf.hi < -4) y1 = Math.min(y1, yOf(0)); if (!up && inf.lo > 4) y1 = Math.max(y1, yOf(0)); }
          if (inf.flag) y1 += up ? -0.3 : 0.3;
        }
        parts.push(line(sx, y0, sx, y1, 0.12));
        if (inf.flag && inf.beam < 0) {
          const fl = up ? (ev.base === 's' ? GL.f16u : GL.f8u) : ev.base === 's' ? GL.f16d : GL.f8d;
          parts.push(T(sx - 0.06, up ? y1 - 0.04 : y1 + 0.13, fl));
        }
        inf.stemTip = y1;
      }
      if (ev.art === 'stacc') {
        const ref = inf.up ? inf.lo : inf.hi, p2 = inf.up ? ref - 2 : ref + 2;
        parts.push(T(x + hw / 2 - 0.17, yOf(p2 % 2 === 0 ? p2 + (inf.up ? -1 : 1) : p2), inf.up ? GL.staccB : GL.staccA));
      }
      if (ev.art === 'accent') {
        const p2 = inf.up ? inf.lo - 3 : inf.hi + 3;
        parts.push(T(x + hw / 2 - 0.66, yOf(p2), inf.up ? GL.accentB : GL.accentA));
      }
    }
    evGroups.push(`<g class="ev" data-s="${s}" data-i="${i}">${parts.join('')}</g>`);

    // Fingering: right hand above, left hand below.
    if (spec.fingers !== false && ev.fing && !ev.rest) {
      const nums = ev.fing.map((f, j) => [f, inf.pos[j]]).filter(([f]) => f).sort((a, b) => b[1] - a[1]);
      const cx = x + HEAD_W[ev.base] / 2 - 0.32;
      if (st.hand === 'L') {
        let yy = Math.max(yOf(inf.lo) + 1.9, inf.up ? 0 : (inf.stemTip || 0) + 1.6, top + 5.4);
        nums.slice().reverse().forEach(([f]) => { text.push(`<text class="fg" x="${U(cx + offX)}" y="${U(yy)}">${fingGlyph(f)}</text>`); yy += 1.25; });
      } else {
        let yy = Math.min(yOf(inf.hi) - 1.0, inf.up ? (inf.stemTip || 99) - 0.5 : 99, top - 0.6);
        nums.slice().reverse().forEach(([f]) => { text.push(`<text class="fg" x="${U(cx + offX)}" y="${U(yy)}">${fingGlyph(f)}</text>`); yy -= 1.25; });
      }
    }
    if (spec.chords !== false && ev.chord && s === 0) {
      const ln = lines[inf.line];
      text.push(`<text class="chs" x="${U(x + offX)}" y="${U(ln.staffY[0] - ln.st[0].above - 0.6)}">${esc(pretty(ev.chord))}</text>`);
    }
    if (ev.dyn) {
      const ln = lines[inf.line], yy = ln.staffY[s] + 4 + ln.st[s].below - (spec.labels ? 2.1 : 0) - 0.7;
      if (DYN_GLYPH[ev.dyn]) glyph.push(T(x - 0.4, yy, ev.dyn.split('').map(ch => GL[ch]).join('')));
      else text.push(`<text class="dw" x="${U(x + offX)}" y="${U(yy)}">${ev.dyn === 'cresc' ? 'cresc.' : ev.dyn === 'dim' ? 'dim.' : esc(ev.dyn)}</text>`);
    }
    // Letter names under the notes: every note, or (when spec.labels is a function) just the ones it picks.
    if (spec.labels && !ev.rest && !ev.hit && (typeof spec.labels !== 'function' || spec.labels(s, i))) {
      const ln = lines[inf.line], yy = ln.staffY[s] + 4 + ln.st[s].below - 0.5;
      const names = inf.pos.map((p, j) => [p, noteLabel(ev.ps[j]), ev.ps[j].L]).sort((a, b) => b[0] - a[0]);
      text.push(`<text class="lb" data-s="${s}" data-i="${i}" x="${U(x + HEAD_W[ev.base] / 2 + offX)}" y="${U(yy)}">${names.map(n => `<tspan class="n-${n[2]}">${n[1]}</tspan>`).join('')}</text>`);
    }
  }));

  // Ties and slurs.
  staves.forEach(st => st.events.forEach((ev, i) => {
    const inf = st.info[i];
    if (inf.x === undefined) return;
    const yOf = (f, p) => f.top + 2 - p / 2;
    if (ev.tie && !ev.rest && st.events[i + 1]) {
      const nx = st.info[i + 1], dir = inf.up ? 1 : -1;
      inf.pos.forEach(p => {
        const y0 = yOf(inf, p) + dir * 0.75;
        const xa = inf.x + HEAD_W[ev.base] + 0.15;
        if (nx.line === inf.line) out.push(curve(xa, y0, nx.x - 0.15, y0, dir));
        else out.push(curve(xa, y0, lines[inf.line].end - 0.3, y0, dir), curve(lines[nx.line].pre - 0.6, yOf(nx, p) + dir * 0.75, nx.x - 0.15, yOf(nx, p) + dir * 0.75, dir));
      });
    }
    if (ev.slurStart) {
      let j = i;
      while (j < st.events.length - 1 && !st.events[j].slurEnd) j++;
      const a = inf, z = st.info[j], dir = inf.up ? 1 : -1;
      if (z.line === a.line && j > i) {
        const ya = (dir > 0 ? yOf(a, a.lo) : yOf(a, a.hi)) + dir * 1.0, yz = (dir > 0 ? yOf(z, z.lo) : yOf(z, z.hi)) + dir * 1.0;
        out.push(curve(a.x + 0.6, ya, z.x + 0.6, yz, dir * 1.4));
      }
    }
  }));

  const W = U(Math.max(...lines.map(l => l.end)) + 0.5 + offX * 2), H = U(totalH);
  const pxW = fx((W / NSP) * scale), pxH = fx((H / NSP) * scale);
  host.innerHTML = `<svg class="sc" viewBox="0 0 ${W} ${H}" width="${pxW}" height="${pxH}" role="img" aria-label="${esc(spec.label || 'Music')}">
    <g class="lines" stroke="currentColor" fill="currentColor">${out.join('')}</g>
    <g class="glyphs" fill="currentColor" font-family="Crescendo Notation" font-size="${4 * NSP}">${glyph.join('')}${evGroups.join('')}</g>
    <g class="texts" fill="currentColor">${text.join('')}</g></svg>`;
  const svg = host.firstElementChild;
  const evs = {};
  svg.querySelectorAll('.ev').forEach(g => { evs[`${g.dataset.s}:${g.dataset.i}`] = g; });
  const api = {
    svg, lines, scale, staves,
    el: (s, i) => evs[`${s}:${i}`],
    mark(s, i, cls) { const g = evs[`${s}:${i}`]; if (g) g.classList.add(cls); },
    unmark(cls) { svg.querySelectorAll(`.ev.${cls}`).forEach(g => g.classList.remove(cls)); },
    pos: (s, i) => evPos[`${s}:${i}`],
    // Where a beat falls horizontally (for a play-along cursor), in CSS pixels.
    cursor(t) {
      let best = null;
      for (const [k, p] of Object.entries(evPos)) {
        const [s, i] = k.split(':').map(Number), ev = staves[s].events[i];
        if (ev.t <= t + 1e-6 && (!best || ev.t > best.t)) best = { t: ev.t, x: p.x, line: p.line, d: ev.d };
      }
      return best;
    },
  };
  return api;
}

// One note on a staff, for flashcards.
function noteCard(host, { clef = 'treble', pitch, key = 'C', scale = 10, width, label }) {
  const ev = { i: 0, t: 0, d: 4, base: 'w', dots: 0, rest: false, ps: [pitch], fing: null, tie: false };
  return engrave(host, { staves: [{ clef, events: [ev] }], key, time: null, width: width || 170, scale, bars: [{ start: 0, len: 4 }], final: false, center: true, label: label || 'A note' });
}
// A clef and key signature only.
function keyCard(host, { clef = 'treble', key = 'C', scale = 9, width }) {
  return engrave(host, { staves: [{ clef, events: [] }], key, time: null, width: width || 200, scale, final: false, center: true, label: `${keyName(key)} key signature` });
}
// Draws a parsed piece (see parsePiece) with the right hands showing.
function drawPiece(host, piece, opt = {}) {
  const hands = opt.hands || 'RL';
  let staves = piece.staves.filter(s => hands.includes(s.hand));
  if (!staves.length) staves = piece.staves;
  const map = staves.map(s => piece.staves.indexOf(s));
  const sc = engrave(host, {
    staves: staves.map(s => ({ clef: s.clef, hand: s.hand, events: s.events })), key: piece.key, time: piece.time, bars: piece.bars,
    width: opt.width, scale: opt.scale, labels: typeof opt.labels === 'function' ? (s, i) => opt.labels(map[s], i) : opt.labels, fingers: opt.fingers, chords: opt.chords, maxBars: opt.maxBars,
    tempo: opt.tempo, fill: opt.fill, label: opt.label, center: opt.center, showTime: opt.showTime,
  });
  sc.staffMap = map;
  sc.elFor = (pieceStaff, i) => sc.el(map.indexOf(pieceStaff), i);
  return sc;
}
