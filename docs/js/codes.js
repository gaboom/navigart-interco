// MEDICO (medical signal code) and INTERCO (general signal code): search, browse by topic, decode a code.
// Both are the same explorer over data/signals.json, restricted to one chapter.
import { loadSignals, esc, normCode, hoist, spell, morseOf, decode } from './signals.js';
import { pretty, visual, play } from './morse.js';

const CFG = {
  medical: {
    title: 'Medico', chapter: 'medical',
    intro: 'The Medical Signal Code: find the message to send, or decode a code you received.',
    placeholder: 'Search: fever, unconscious… or a code',
    manual: 'chapter-3-medical-signal-code',
  },
  general: {
    title: 'Interco', chapter: 'general',
    intro: 'The General Signal Code: find the signal for a message, or enter any code to see every form of it.',
    placeholder: 'Search: collision, tug, fog… or a code',
    manual: 'chapter-2-general-signal-code',
  },
};

const topicOf = (s) => s.group || 'Other';

function score(s, words) {
  const text = (s.text.en + ' ' + s.topic + ' ' + s.group).toLowerCase();
  let n = 0;
  for (const w of words) {
    if (s.code.toLowerCase().replace(' ', '') === w.replace(' ', '')) n += 20;
    else if (text.includes(w)) n += 3 + (s.text.en.toLowerCase().includes(w) ? 2 : 0);
    else return 0;
  }
  return n;
}

function row(s) {
  const star = s.star ? '<span class="star" title="Marked with an asterisk in the manual">*</span>' : '';
  const indent = / \d+$/.test(s.code) ? ' sub' : '';
  return `<a class="srow${indent}" href="#/${s.chapter === 'medical' ? 'medico' : 'interco'}/${encodeURIComponent(s.code)}">
    <span class="scode">${esc(s.code)}${star}</span><span class="stext">${esc(s.text.en)}</span></a>`;
}

export async function explorer(root, kind, param) {
  const cfg = CFG[kind];
  const all = (await loadSignals()).filter((s) => s.chapter === cfg.chapter);
  if (param) return detail(root, cfg, all, decodeURIComponent(param));

  const groups = [...new Set(all.map(topicOf))];
  root.innerHTML = `
    <h1>${cfg.title}</h1>
    <p class="muted">${cfg.intro} <a href="#/study/${cfg.manual}">Read the chapter</a>.</p>
    <div class="tools">
      <input type="search" id="q" placeholder="${esc(cfg.placeholder)}" aria-label="Search or enter a code" autocomplete="off" spellcheck="false">
    </div>
    <div class="explorer">
      <nav class="cats" aria-label="Topics"><button type="button" data-g="" aria-pressed="true">All topics <small>${all.length}</small></button>
        ${groups.map((g) => `<button type="button" data-g="${esc(g)}" aria-pressed="false">${esc(g)} <small>${all.filter((s) => topicOf(s) === g).length}</small></button>`).join('')}</nav>
      <div class="results" id="res" aria-live="polite"></div>
    </div>`;
  const res = root.querySelector('#res');
  const st = { g: '', q: '' };
  const draw = () => {
    const q = st.q.trim().toLowerCase();
    let rows;
    if (q) {
      const words = q.split(/\s+/).filter(Boolean);
      rows = all.filter((s) => !st.g || topicOf(s) === st.g).map((s) => [score(s, words), s]).filter(([n]) => n > 0)
        .sort((a, b) => b[0] - a[0]).map(([, s]) => s).slice(0, 150);
      res.innerHTML = rows.length ? `<p class="muted">${rows.length}${rows.length === 150 ? '+' : ''} matches</p>${rows.map(row).join('')}`
        : `<p>No match. Try fewer or simpler words, or pick a topic.</p>`;
    } else {
      rows = all.filter((s) => !st.g || topicOf(s) === st.g);
      let last = null;
      res.innerHTML = rows.map((s) => {
        const head = s.topic && s.topic !== last ? `<h3 class="ttl">${esc(s.topic)}</h3>` : '';
        const gh = (!st.g && topicOf(s) !== (last === null ? null : lastG) ? `<h2 class="gttl">${esc(topicOf(s))}</h2>` : '');
        last = s.topic; lastG = topicOf(s);
        return gh + head + row(s);
      }).join('');
    }
  };
  let lastG = null;
  const redraw = () => { lastG = null; draw(); };
  const route = cfg.chapter === 'medical' ? 'medico' : 'interco';
  root.querySelector('#q').addEventListener('input', (e) => { st.q = e.target.value; redraw(); });
  // Enter on something that looks like a code (MCU, ae1, MCZ 3) opens its decode view.
  root.querySelector('#q').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && /^[A-Za-z]{1,3} ?[0-9]{0,2}$/.test(st.q.trim())) location.hash = `#/${route}/${encodeURIComponent(normCode(st.q))}`;
  });
  root.querySelectorAll('.cats button').forEach((b) => b.addEventListener('click', () => {
    st.g = b.dataset.g;
    root.querySelectorAll('.cats button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    redraw();
  }));
  redraw();
}

async function detail(root, cfg, all, code) {
  const back = `#/${cfg.chapter === 'medical' ? 'medico' : 'interco'}`;
  const d = await decode(code, cfg.chapter);
  const hit = d.exact[0];
  const base = !hit ? d.base[0] : null;
  const shown = hit || base;
  const flags = await hoist(d.code);
  const morseGroups = await morseOf(d.code);
  const spelled = await spell(d.code);
  const star = shown?.star ? ' *' : '';
  const siblings = shown ? all.filter((s) => s.base === shown.base && s.code !== shown.code).slice(0, 14) : [];
  root.innerHTML = `
    <p><a href="${back}">← ${cfg.title}</a></p>
    <article class="detail wide">
      <div>
        <h1 class="bigcode">${esc(d.code)}${star}</h1>
        ${flags}
        <dl class="kv">
          <dt>Spelled</dt><dd>${esc(spelled)}</dd>
          <dt>Morse</dt><dd>${morseGroups.map((g) => `<span class="morse">${g.map(pretty).join('&emsp;')}</span>`).join(' &nbsp; ')}</dd>
        </dl>
        <p><button class="act" id="play" type="button">▶ Play Morse</button></p>
      </div>
      <div>
        ${hit ? `<h2>Meaning</h2><p class="mean">${esc(hit.text.en)}</p>
          <p class="muted">${esc(topicOf(hit))}${hit.topic ? ' › ' + esc(hit.topic) : ''} · <a href="#/study/page/${hit.page}">Pub. 102 p.${hit.page}</a></p>`
        : base ? `<h2>Meaning of ${esc(base.code)}</h2><p class="mean">${esc(base.text.en)}</p>
          <p>The number <strong>${esc(d.complement)}</strong> is a <em>complement</em>: it changes or completes the meaning as the manual's tables for this signal say.
          <a href="#/study/page/${base.page}">See p.${base.page}</a>.</p>`
        : `<h2>Not found</h2><p>${esc(d.code)} is not a ${cfg.title === 'Medico' ? 'medical' : 'general'} signal in Pub. 102.</p>
           ${d.prefix.length ? `<h3>Codes that start with ${esc(d.code)}</h3>${d.prefix.map(row).join('')}` : ''}`}
        ${siblings.length ? `<h3>Related: ${esc(shown.base)}</h3>${siblings.map(row).join('')}` : ''}
      </div>
    </article>`;
  const btn = root.querySelector('#play');
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    await play(morseGroups.map((g) => g.join(' ')).join('   '), {});
    btn.disabled = false;
  });
}

/** "Decode any code": a small box used on the Interco start page (also reachable by typing into the explorer). */
export { normCode };
