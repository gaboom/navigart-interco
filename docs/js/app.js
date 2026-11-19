// Interco app shell: hash router and views.
import * as browse from './browse.js';
import * as study from './study.js';
import { quiz } from './quiz.js';
import { explorer } from './codes.js';
import { icon, FEATURES } from './icons.js';

const view = document.getElementById('view');
const nav = document.getElementById('nav');
const lightbox = document.getElementById('lightbox');
lightbox.addEventListener('click', () => { lightbox.hidden = true; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lightbox.hidden = true; });

nav.innerHTML =
  '<a class="logo" href="#/" aria-label="Interco home">Interco</a>' +
  FEATURES.map((f) => f.href
    ? `<a class="item" data-nav="${f.id}" href="${f.href}">${icon(f.icon)}<span>${f.label}</span></a>`
    : `<span class="item soon" aria-disabled="true" title="Coming in ${f.soon}">${icon(f.icon)}<span>${f.label}</span></span>`).join('');

function home() {
  view.innerHTML = `
    <h1>International Code of Signals</h1>
    <p class="muted home-intro">A free, offline trainer built on ICS Pub. 102. No login, no tracking.</p>
    <div class="cards">
      ${FEATURES.map((f) => f.href
        ? `<a class="card" href="${f.href}">${icon(f.icon)}<h2>${f.label}</h2><span class="muted">${{ study: 'Read the manual with working links and enlargeable figures.', browse: 'Flags, pennants, letters and numerals with Morse and phonetic words.', quiz: 'Pick the matching flag, code, Morse or message from four.', medico: 'Find the medical signal to send, or decode one you received.', interco: 'Find any general signal, or enter a code to see every form.' }[f.id]}</span></a>`
        : `<span class="card muted">${icon(f.icon)}<h2>${f.label}</h2>Coming in ${f.soon}.</span>`).join('')}
    </div>`;
}

let cleanup = null;

async function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [root, a, b] = parts;
  nav.querySelectorAll('[data-nav]').forEach((l) => {
    if (l.dataset.nav === root) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
  });
  browse.leave();
  if (cleanup) { cleanup(); cleanup = null; }
  try {
    if (!root) home();
    else if (root === 'browse') await (a ? browse.detail(view, a) : browse.list(view));
    else if (root === 'quiz') cleanup = await quiz(view);
    else if (root === 'medico') await explorer(view, 'medical', a);
    else if (root === 'interco') await explorer(view, 'general', a);
    else if (root === 'study') {
      if (!a) await study.overview(view);
      else if (a === 'page') await study.page(view, parseInt(b, 10));
      else await study.chapter(view, a, b);
    } else view.innerHTML = '<p>Not found. <a href="#/">Home</a></p>';
  } catch (err) {
    console.error(err);
    view.innerHTML = '<p>Something went wrong loading this page. <a href="#/">Home</a></p>';
  }
  if (!(root === 'study' && b)) window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();
