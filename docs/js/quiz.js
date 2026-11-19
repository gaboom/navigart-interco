// QUIZ: one question type X is shown, pick the matching answer of type O from four options.
// Types: flag, code ("A – ALFA"), morse, message (single-letter signals). X and O must differ.
// UX: everything for one question fits one screen (prompt, four options, feedback bar); a correct answer
// continues by itself after a moment, a wrong one waits so the right answer can be read.
import { load } from './browse.js';
import { pretty, visual, play, stop } from './morse.js';

const TYPES = [
  ['flag', 'Flag', 'The flag'],
  ['code', 'Code', 'Letter and code word'],
  ['morse', 'Morse', 'Dots and dashes'],
  ['message', 'Message', 'Meaning of the signal'],
];
const COUNTS = [5, 10, 20];
const NOTATIONS = [['bisso', 'BISSOTWO'], ['plain', 'TWO'], ['random', 'Random']];
const KEY = 'interco.quiz';
const AUTO_MS = 1100;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const DEFAULTS = { x: 'flag', o: 'code', n: 10, notation: 'bisso', auto: true };

function loadPrefs() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...DEFAULTS }; }
}
function savePrefs(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode: fine */ } }

function distance(a, b) { // edit distance between two Morse strings: used to pick look-alike distractors
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** The entries that can be asked for this X/O pair. Message needs a single-letter signal (no digits, no R). */
export function poolFor(entries, x, o) {
  const needsMessage = x === 'message' || o === 'message';
  return entries.filter((e) => (e.kind === 'letter' || e.kind === 'numeral') && (!needsMessage || e.hasMessage));
}

export function pickDistractors(pool, answer, type, n = 3) {
  let cands = pool.filter((e) => e.id !== answer.id && e.kind === answer.kind);
  if (cands.length < n) cands = pool.filter((e) => e.id !== answer.id);
  if (type === 'morse') cands = [...cands].sort((a, b) => distance(a.morse, answer.morse) - distance(b.morse, answer.morse)).slice(0, 8);
  return shuffle(cands).slice(0, n);
}

/** First sentence of a long meaning, at most ~90 characters, so four options fit one screen. The full text is shown in the feedback. */
export function shortMessage(m) {
  if (m.length <= 90) return m;
  const first = m.match(/^.{10,}?[.;:](?=[ —]|$)/);
  return first && first[0].length <= 100 ? first[0] : m.slice(0, 90).replace(/[ ]+[^ ]*$/, '') + '…';
}

function render(e, type, notation, short = false) {
  const t = e.text.en;
  switch (type) {
    case 'flag': return `<img class="qflag" src="assets/flags/${e.flag}.svg" alt="">`;
    case 'code': {
      const word = e.kind === 'numeral' ? (notation === 'plain' ? t.plain : t.word) : t.word;
      return `<span class="qcode"><b>${esc(e.char)}</b> – ${esc(word.toUpperCase())}</span>`;
    }
    case 'morse': return `<span class="qmorse"><span class="morse">${pretty(e.morse)}</span>${visual(e.morse)}</span>`;
    case 'message': return `<span class="qmsg">${esc(short ? shortMessage(t.message) : t.message)}</span>`;
  }
  return '';
}

function label(e, type, notation) { // text for assistive tech (the flag has none: it would give the answer away)
  const t = e.text.en;
  if (type === 'code') return `${e.char} – ${(e.kind === 'numeral' && notation === 'plain' ? t.plain : t.word).toUpperCase()}`;
  if (type === 'morse') return pretty(e.morse);
  if (type === 'message') return t.message;
  return 'Flag';
}

export async function quiz(root) {
  const data = await load();
  const entries = data.entries;
  const prefs = loadPrefs();
  let keyHandler = null;
  let timer = null;
  const removeKeys = () => { if (keyHandler) document.removeEventListener('keydown', keyHandler); keyHandler = null; clearTimeout(timer); stop(); };
  setup();

  function setup() {
    removeKeys();
    if (prefs.x === prefs.o) prefs.o = TYPES.find(([k]) => k !== prefs.x)[0];
    const pool = poolFor(entries, prefs.x, prefs.o);
    // The numeral notation only matters when codes are shown and numerals are in the pool (no message quiz).
    const showNotation = (prefs.x === 'code' || prefs.o === 'code') && prefs.x !== 'message' && prefs.o !== 'message';
    const chip = (name, v, on, text, sub, off) => `<label class="chip ${off ? 'off' : ''}"><input type="radio" name="${name}" value="${v}" ${on ? 'checked' : ''} ${off ? 'disabled' : ''}><span><b>${text}</b>${sub ? `<small>${sub}</small>` : ''}</span></label>`;
    root.innerHTML = `
      <form class="qsetup" id="qs">
        <h1>Quiz</h1>
        <fieldset><legend>You see</legend><div class="chips four">${TYPES.map(([k, n, d]) => chip('x', k, prefs.x === k, n, d)).join('')}</div></fieldset>
        <fieldset><legend>You answer with</legend><div class="chips four">${TYPES.map(([k, n, d]) => chip('o', k, prefs.o === k, n, d, prefs.x === k)).join('')}</div></fieldset>
        <div class="row2">
          <fieldset><legend>Questions</legend><div class="chips">${COUNTS.map((c) => chip('n', c, prefs.n === c, c)).join('')}</div></fieldset>
          ${showNotation ? `<fieldset><legend>Numerals as code</legend><div class="chips">${NOTATIONS.map(([k, n]) => chip('notation', k, prefs.notation === k, n)).join('')}</div></fieldset>` : ''}
        </div>
        <label class="switch"><input type="checkbox" name="auto" ${prefs.auto ? 'checked' : ''}> <span>Continue by itself after a correct answer</span></label>
        <p class="muted" id="poolnote">${pool.length} signals${prefs.x === 'message' || prefs.o === 'message' ? ' (letters with a meaning; numerals and R have none)' : ' (A–Z and 0–9)'}</p>
        <div class="startbar"><button class="act big" type="submit">Start ▶</button></div>
      </form>`;
    const form = root.querySelector('#qs');
    form.addEventListener('change', () => {
      const f = new FormData(form);
      prefs.x = f.get('x'); prefs.o = f.get('o') || prefs.o; prefs.n = +f.get('n'); prefs.notation = f.get('notation'); prefs.auto = f.has('auto');
      savePrefs(prefs);
      setup();
    });
    form.addEventListener('submit', (ev) => { ev.preventDefault(); start(); });
  }

  function start() {
    const pool = poolFor(entries, prefs.x, prefs.o);
    const asked = shuffle(pool).slice(0, Math.min(prefs.n, pool.length));
    const questions = asked.map((a) => {
      const notation = prefs.notation === 'random' ? (Math.random() < 0.5 ? 'plain' : 'bisso') : prefs.notation;
      return { a, notation, options: shuffle([a, ...pickDistractors(pool, a, prefs.o)]) };
    });
    ask(questions, 0, []);
  }

  function ask(qs, i, log) {
    removeKeys();
    const q = qs[i];
    const right = log.filter((l) => l.ok).length;
    const wrong = log.length - right;
    const oneCol = prefs.o === 'message';
    root.innerHTML = `
      <div class="qscreen" data-x="${prefs.x}" data-o="${prefs.o}">
        <header class="qhead">
          <span class="qn">${i + 1}<small>/${qs.length}</small></span>
          <span class="qbar" role="progressbar" aria-valuemin="0" aria-valuemax="${qs.length}" aria-valuenow="${i}"><i style="width:${(i / qs.length) * 100}%"></i></span>
          <span class="qscore" aria-label="${right} right, ${wrong} wrong"><b class="g">✓ ${right}</b> <b class="r">✗ ${wrong}</b></span>
          <button class="x" id="quit" type="button" aria-label="Stop the quiz">✕</button>
        </header>
        <section class="qprompt" aria-label="Question">${render(q.a, prefs.x, q.notation)}${prefs.x === 'morse' ? '<button class="act sec" id="pm" type="button">▶ Play</button>' : ''}</section>
        <div class="qopts ${oneCol ? 'one' : 'two'}" id="opts" role="group" aria-label="Choose the matching ${TYPES.find(([k]) => k === prefs.o)[1].toLowerCase()}">
          ${q.options.map((e, k) => `<button type="button" class="qopt" data-id="${e.id}" aria-label="${k + 1}. ${esc(label(e, prefs.o, q.notation))}"><kbd>${k + 1}</kbd>${render(e, prefs.o, q.notation, true)}</button>`).join('')}
        </div>
        <div id="fb" class="fbslot" aria-live="polite"></div>
      </div>`;
    const pm = root.querySelector('#pm');
    if (pm) pm.addEventListener('click', () => play(q.a.morse));
    root.querySelector('#quit').addEventListener('click', () => { if (!log.length || confirm('Stop this quiz?')) setup(); });
    let answered = false;
    const next = () => { removeKeys(); i + 1 === qs.length ? result(qs, log) : ask(qs, i + 1, log); };
    const choose = (id) => {
      if (answered) return;
      answered = true;
      stop();
      const ok = id === q.a.id;
      log.push({ q, picked: entries.find((e) => e.id === id), ok });
      if (!ok && navigator.vibrate) navigator.vibrate(60);
      root.querySelectorAll('.qopt').forEach((b) => {
        b.disabled = true;
        if (b.dataset.id === q.a.id) { b.classList.add('right'); b.insertAdjacentHTML('beforeend', '<span class="mark">✓</span>'); }
        else if (b.dataset.id === id) { b.classList.add('wrong'); b.insertAdjacentHTML('beforeend', '<span class="mark">✗</span>'); }
        else b.classList.add('dim');
      });
      const t = q.a.text.en;
      const auto = ok && prefs.auto;
      root.querySelector('#fb').innerHTML = `
        <div class="fb ${ok ? 'ok' : 'no'}">
          <div class="fbtext"><strong>${ok ? '✓ Correct' : '✗ It was'}</strong>
            <span class="fbans"><b>${esc(q.a.char)} – ${esc(t.word.toUpperCase())}</b> <span class="morse">${pretty(q.a.morse)}</span></span>
            ${t.message && (!ok || prefs.o === 'message') ? `<span class="fbmsg">${esc(t.message)}</span>` : ''}</div>
          <button class="act" id="next" type="button">${i + 1 === qs.length ? 'Result' : 'Next'} →</button>
          ${auto ? `<i class="fbtimer" style="animation-duration:${AUTO_MS}ms"></i>` : ''}
        </div>`;
      const nb = root.querySelector('#next');
      nb.addEventListener('click', next);
      nb.focus({ preventScroll: true });
      if (auto) timer = setTimeout(next, AUTO_MS);
    };
    root.querySelector('#opts').addEventListener('click', (ev) => { const b = ev.target.closest('.qopt'); if (b) choose(b.dataset.id); });
    keyHandler = (ev) => {
      if (/^[1-4]$/.test(ev.key) && !answered) { const b = root.querySelectorAll('.qopt')[+ev.key - 1]; if (b) choose(b.dataset.id); }
      else if ((ev.key === 'Enter' || ev.key === ' ') && answered && document.activeElement?.id !== 'next') { ev.preventDefault(); next(); }
    };
    document.addEventListener('keydown', keyHandler);
  }

  function result(qs, log) {
    removeKeys();
    const right = log.filter((l) => l.ok).length;
    const wrong = log.filter((l) => !l.ok);
    const pct = Math.round((right / qs.length) * 100);
    root.innerHTML = `
      <div class="qresult">
        <h1>${right === qs.length ? 'Perfect' : pct >= 70 ? 'Well done' : 'Keep going'}</h1>
        <p class="score"><b>${right}</b><small> / ${qs.length}</small></p>
        <div class="dots" aria-hidden="true">${log.map((l) => `<i class="${l.ok ? 'g' : 'r'}"></i>`).join('')}</div>
        ${wrong.length ? `<h2>Review (${wrong.length})</h2><div class="review">${wrong.map((l) => `
          <div class="rv"><div class="rvq">${render(l.q.a, prefs.x, l.q.notation)}</div>
            <div class="rvc"><span class="muted">Answer</span>${render(l.q.a, prefs.o, l.q.notation)}</div>
            <div class="rvp"><span class="muted">You chose</span>${render(l.picked, prefs.o, l.q.notation)}</div></div>`).join('')}</div>` : ''}
        <div class="startbar two">
          <button class="act big" id="again" type="button">${wrong.length ? 'Practise again' : 'Again'}</button>
          <button class="act sec big" id="change" type="button">Settings</button>
        </div>
      </div>`;
    root.querySelector('#again').addEventListener('click', start);
    root.querySelector('#change').addEventListener('click', setup);
  }

  return removeKeys;
}
