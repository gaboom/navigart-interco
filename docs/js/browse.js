// BROWSE: the library of flags, letters, numerals and pennants (data: data/alphabet.json).
import { visual, pretty, play, stop } from './morse.js';

let data;
export async function load() {
  if (!data) data = await (await fetch('data/alphabet.json')).json();
  return data;
}

const KINDS = [
  ['all', 'All'],
  ['letter', 'Letters'],
  ['numeral', 'Numerals'],
  ['pennant', 'Pennants'],
];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const flagSrc = (e) => `assets/flags/${e.flag}.svg`;
const isPennant = (e) => e.kind === 'substitute' || e.kind === 'code';

function label(e) {
  return e.kind === 'numeral' ? `${e.char} – ${e.text.en.word.toUpperCase()}` : e.kind === 'letter' ? `${e.char} – ${e.text.en.word.toUpperCase()}` : e.text.en.word;
}

export async function list(root, params) {
  const d = await load();
  const state = { kind: 'all', q: '' };
  root.innerHTML = `
    <h1>Browse</h1>
    <p class="muted">Flags, pennants, letters and numerals with their Morse code and phonetic words. Select one for details. <a href="ICS.pdf" download>Download ICS Pub. 102</a>.</p>
    <div class="tools">
      <input type="search" id="q" placeholder="Search letter, word or meaning" aria-label="Search">
      <div class="seg" role="group" aria-label="Type">${KINDS.map(([k, n]) => `<button type="button" data-k="${k}" aria-pressed="${k === 'all'}">${n}</button>`).join('')}</div>
    </div>
    <div class="grid" id="grid"></div>
    <p class="muted" id="count"></p>`;
  const grid = root.querySelector('#grid');
  const draw = () => {
    const q = state.q.trim().toLowerCase();
    const rows = d.entries.filter((e) => {
      if (state.kind === 'pennant' ? !isPennant(e) : state.kind !== 'all' && e.kind !== state.kind) return false;
      if (!q) return true;
      const t = e.text.en;
      return [e.char, t.word, t.plain, t.message, t.pronunciation, e.morse].some((v) => v && String(v).toLowerCase().includes(q));
    });
    grid.innerHTML = rows.map((e) => `
      <button type="button" class="tile" data-id="${e.id}" aria-label="${esc(label(e))}">
        <img src="${flagSrc(e)}" alt="" loading="lazy">
        <span class="ch">${esc(e.char || '')}</span>
        <span class="wd">${esc(e.kind === 'numeral' ? `${e.text.en.plain} / ${e.text.en.word}` : e.text.en.word)}</span>
        ${e.morse ? `<span class="morse">${pretty(e.morse)}</span>` : ''}
      </button>`).join('');
    root.querySelector('#count').textContent = `${rows.length} entries`;
  };
  root.querySelector('#q').addEventListener('input', (ev) => { state.q = ev.target.value; draw(); });
  root.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => {
    state.kind = b.dataset.k;
    root.querySelectorAll('.seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    draw();
  }));
  grid.addEventListener('click', (ev) => {
    const t = ev.target.closest('.tile');
    if (t) location.hash = `#/browse/${t.dataset.id}`;
  });
  draw();
}

export async function detail(root, id) {
  const d = await load();
  const e = d.entries.find((x) => x.id === id);
  if (!e) { root.innerHTML = '<p>Entry not found. <a href="#/browse">Back to Browse</a></p>'; return; }
  const t = e.text.en;
  const rows = [];
  if (e.kind === 'letter') {
    rows.push(['Code', `${e.char} – ${t.word.toUpperCase()}`], ['Pronounced', t.pronunciation]);
  } else if (e.kind === 'numeral') {
    rows.push(['Code', `${e.char} – ${t.plain.toUpperCase()}`], ['ICS code word', `${e.char} – ${t.word.toUpperCase()}`], ['Pronounced', t.pronunciation]);
  }
  if (e.morse) rows.push(['Morse', `<span class="morse">${pretty(e.morse)}</span>`]);
  const srcPages = [...new Set(Object.values(e.source).sort((x, y) => x - y).map((v) => (v - 5 >= 1 ? `p.${v - 5}` : 'flags page')))];
  root.innerHTML = `
    <p><a href="#/browse">← Browse</a></p>
    <article class="detail">
      <img class="big" src="${flagSrc(e)}" alt="${e.kind === 'pennant' ? '' : 'Flag '}${esc(label(e))}">
      <div>
        <h1>${esc(e.char ? label(e) : t.word)}</h1>
        <dl class="kv">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${k === 'Morse' ? v : esc(v)}</dd>`).join('')}</dl>
        ${e.morse ? `<div id="mv">${visual(e.morse)}</div><p><button class="act" id="play" type="button">▶ Play Morse</button></p>` : ''}
        ${t.message ? `<h2>Single-letter signal</h2><p>${esc(t.message)}</p>${e.soundRestricted ? '<p class="fnote"><a class="fn" href="#/study/chapter-1-signaling-instructions/fn-p21">*</a> The manual marks this letter with an asterisk: when it is made <strong>by sound</strong> it may only be used in line with the collision regulations (COLREG 1972). It does not apply to flags or lights.</p>' : ''}`
          : e.kind === 'letter' ? '<h2>Single-letter signal</h2><p class="muted">The single-letter table has no entry for this letter.</p>' : ''}
        <p class="muted">Source: Pub. 102 (2020), ${srcPages.join(', ')} · <a href="#/study/page/${e.source.singleLetter ? e.source.singleLetter - 5 : (e.source.letterSpelling || e.source.figureSpelling || 2) - 5}">open in the manual</a></p>
      </div>
    </article>`;
  const btn = root.querySelector('#play');
  if (btn) btn.addEventListener('click', async () => {
    const dots = [...root.querySelectorAll('#mv i')];
    btn.disabled = true;
    await play(e.morse, { onSymbol: (i) => dots.forEach((x, k) => x.classList.toggle('on', k === i)) });
    btn.disabled = false;
  });
}

export function leave() { stop(); }
