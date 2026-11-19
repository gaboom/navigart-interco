// Flag specifications for the International Code of Signals.
// Source of truth for the flag drawings: verified against Pub. 102 (2020), page 2 "International Flags and Pennants".
// Each flag = a shape (the outline and its viewBox) + a list of fills drawn inside it.
// Run `node tools/gen-flags.mjs` to write docs/assets/flags/*.svg.

export const C = {
  R: '#e3262b', // red
  B: '#0a1f8f', // blue
  Y: '#ffe600', // yellow
  K: '#111111', // black
  W: '#ffffff', // white
};

// Shapes: viewBox size and outline polygon.
export const SHAPES = {
  rect:    { w: 40,  h: 30, poly: '0,0 40,0 40,30 0,30' },
  swallow: { w: 40,  h: 30, poly: '0,0 40,0 28,15 40,30 0,30' },
  numeral: { w: 120, h: 30, poly: '0,0 120,10 120,20 0,30' },
  sub:     { w: 60,  h: 30, poly: '0,0 60,15 0,30' },
  code:    { w: 80,  h: 30, poly: '0,0 80,6 80,24 0,30' },
};

const rect = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C[f]}"/>`;
const poly = (pts, f) => `<polygon points="${pts}" fill="${C[f]}"/>`;
const disc = (cx, cy, r, f) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C[f]}"/>`;
const line = (x1, y1, x2, y2, w, f) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C[f]}" stroke-width="${w}"/>`;
const bg = (shape, f) => rect(0, 0, SHAPES[shape].w, SHAPES[shape].h, f);

const hstripes = (cols, w = 40, h = 30, weights) => {
  const ws = weights || cols.map(() => 1);
  const sum = ws.reduce((a, b) => a + b, 0);
  let y = 0;
  return cols.map((f, i) => { const hh = (h * ws[i]) / sum; const r = rect(0, y, w, hh + 0.05, f); y += hh; return r; }).join('');
};
const vstripes = (cols, w = 40, h = 30, weights) => {
  const ws = weights || cols.map(() => 1);
  const sum = ws.reduce((a, b) => a + b, 0);
  let x = 0;
  return cols.map((f, i) => { const ww = (w * ws[i]) / sum; const r = rect(x, 0, ww + 0.05, h, f); x += ww; return r; }).join('');
};

export const FLAGS = {
  // ---- alphabet ----
  A: { shape: 'swallow', body: rect(0, 0, 18, 30, 'W') + rect(18, 0, 22, 30, 'B') },
  B: { shape: 'swallow', body: bg('swallow', 'R') },
  C: { shape: 'rect', body: hstripes(['B', 'W', 'R', 'W', 'B']) },
  D: { shape: 'rect', body: hstripes(['Y', 'B', 'Y'], 40, 30, [1, 2, 1]) },
  E: { shape: 'rect', body: hstripes(['B', 'R']) },
  F: { shape: 'rect', body: bg('rect', 'W') + poly('20,0 40,15 20,30 0,15', 'R') },
  G: { shape: 'rect', body: vstripes(['Y', 'B', 'Y', 'B', 'Y', 'B']) },
  H: { shape: 'rect', body: vstripes(['W', 'R']) },
  I: { shape: 'rect', body: bg('rect', 'Y') + disc(20, 15, 7, 'K') },
  J: { shape: 'rect', body: hstripes(['B', 'W', 'B']) },
  K: { shape: 'rect', body: vstripes(['Y', 'B']) },
  L: { shape: 'rect', body: rect(0, 0, 20, 15, 'Y') + rect(20, 0, 20, 15, 'K') + rect(0, 15, 20, 15, 'K') + rect(20, 15, 20, 15, 'Y') },
  M: { shape: 'rect', body: bg('rect', 'B') + line(0, 0, 40, 30, 4.4, 'W') + line(0, 30, 40, 0, 4.4, 'W') },
  N: {
    shape: 'rect',
    body: bg('rect', 'W') + [0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3].filter((c) => (r + c) % 2 === 0).map((c) => rect(c * 10, r * 7.5, 10.02, 7.52, 'B'))).join(''),
  },
  O: { shape: 'rect', body: poly('0,0 0,30 40,30', 'Y') + poly('0,0 40,0 40,30', 'R') },
  P: { shape: 'rect', body: bg('rect', 'B') + rect(10, 9, 20, 12, 'W') },
  Q: { shape: 'rect', body: bg('rect', 'Y') },
  R: { shape: 'rect', body: bg('rect', 'R') + rect(16, 0, 8, 30, 'Y') + rect(0, 11, 40, 8, 'Y') },
  S: { shape: 'rect', body: bg('rect', 'W') + rect(12, 9, 16, 12, 'B') },
  T: { shape: 'rect', body: vstripes(['R', 'W', 'B']) },
  U: { shape: 'rect', body: rect(0, 0, 20, 15, 'R') + rect(20, 0, 20, 15, 'W') + rect(0, 15, 20, 15, 'W') + rect(20, 15, 20, 15, 'R') },
  V: { shape: 'rect', body: bg('rect', 'W') + line(0, 0, 40, 30, 4.4, 'R') + line(0, 30, 40, 0, 4.4, 'R') },
  W: { shape: 'rect', body: bg('rect', 'B') + rect(7, 5.5, 26, 19, 'W') + rect(14, 11, 12, 8, 'R') },
  X: { shape: 'rect', body: bg('rect', 'W') + rect(16, 0, 8, 30, 'B') + rect(0, 11, 40, 8, 'B') },
  Y: {
    shape: 'rect',
    body: bg('rect', 'R') + [0, 1, 2, 3, 4, 5, 6].map((k) => { const c = 7.5 + 10 * k; return line(c - 30, 30, c, 0, 3.54, 'Y'); }).join(''),
  },
  Z: { shape: 'rect', body: poly('0,0 40,0 20,15', 'Y') + poly('40,0 40,30 20,15', 'B') + poly('0,30 40,30 20,15', 'R') + poly('0,0 0,30 20,15', 'K') },

  // ---- numeral pennants ----
  '1': { shape: 'numeral', body: bg('numeral', 'W') + disc(30, 15, 7, 'R') },
  '2': { shape: 'numeral', body: bg('numeral', 'B') + disc(30, 15, 7, 'W') },
  '3': { shape: 'numeral', body: vstripes(['R', 'W', 'B'], 120, 30) },
  '4': { shape: 'numeral', body: bg('numeral', 'R') + rect(0, 14, 120, 2.4, 'W') + rect(40, 0, 3, 30, 'W') },
  '5': { shape: 'numeral', body: vstripes(['Y', 'B'], 120, 30, [1, 1.1]) },
  '6': { shape: 'numeral', body: hstripes(['K', 'W'], 120, 30) },
  '7': { shape: 'numeral', body: hstripes(['Y', 'R'], 120, 30) },
  '8': { shape: 'numeral', body: bg('numeral', 'W') + rect(0, 14, 120, 2.4, 'R') + rect(40, 0, 3, 30, 'R') },
  '9': { shape: 'numeral', body: rect(0, 0, 66, 15, 'W') + rect(0, 15, 66, 15, 'R') + rect(66, 0, 54, 15, 'K') + rect(66, 15, 54, 15, 'Y') },
  '0': { shape: 'numeral', body: vstripes(['Y', 'R', 'Y'], 120, 30) },

  // ---- substitutes and code/answering pennant ----
  S1: { shape: 'sub', body: bg('sub', 'B') + poly('0,9 0,21 32,15', 'Y') },
  S2: { shape: 'sub', body: bg('sub', 'W') + rect(0, 0, 18, 30, 'B') },
  S3: { shape: 'sub', body: bg('sub', 'W') + rect(0, 11, 60, 8, 'K') },
  CODE: { shape: 'code', body: vstripes(['R', 'W', 'R', 'W', 'R'], 80, 30) },
};
