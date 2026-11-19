// STUDY: the manual as linked HTML (data: data/manual/toc.json and one HTML fragment per chapter).
let toc;
// Chapters whose PDF bookmarks are only letters or headings (the indexes) get no sub-entries in the table of contents.
const NO_SUB = new Set(['signal-index', 'medical-index', 'indexes']);
const cache = new Map();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function loadToc() {
  if (!toc) toc = await (await fetch('data/manual/toc.json')).json();
  return toc;
}

async function loadChapter(id) {
  if (!cache.has(id)) cache.set(id, (await fetch(`data/manual/${id}.html`)).text());
  return cache.get(id);
}

function chapterForPage(t, printedPage) {
  const pdf = printedPage + t.offset;
  return t.chapters.find((c) => pdf >= c.pdfStart && pdf <= c.pdfEnd);
}

function tocHtml(t, current) {
  const items = t.outline.map((o, i) => ({ ...o, i })).filter((o) => !NO_SUB.has(o.chapter));
  const out = ['<ul>'];
  for (const c of t.chapters.filter((x) => x.id !== 'front-cover')) {
    const open = c.id === current;
    const href = c.id === 'international-flags-and-pennants' ? '#/browse' : `#/study/${c.id}`;
    out.push(`<li class="l1"><a href="${href}" ${open ? 'class="cur" aria-current="true"' : ''}>${esc(c.title)}</a>`);
    if (open) {
      out.push('<ul>');
      for (const o of items.filter((x) => x.chapter === c.id && x.level > 1)) {
        const anchor = o.anchor || `pdf${o.pdfPage}`;
        out.push(`<li class="l${o.level}"><a href="#/study/${c.id}/${anchor}">${esc(o.title)}</a></li>`);
      }
      out.push('</ul>');
    }
    out.push('</li>');
  }
  out.push('</ul>');
  return out.join('');
}

export async function overview(root) {
  const t = await loadToc();
  const hidden = new Set(['front-cover', 'indexes']);
  const sections = t.chapters.filter((c) => !hidden.has(c.id)).map((c) => {
    const flags = c.id === 'international-flags-and-pennants';
    const href = flags ? '#/browse' : `#/study/${c.id}`;
    const entries = flags || NO_SUB.has(c.id) ? [] : t.outline.filter((o) => o.chapter === c.id && o.level > 1);
    const range = c.start ? `<span class="pg">${c.start}–${c.end}</span>` : '';
    return `<section><h2><a href="${href}">${esc(c.title)}</a> ${range}</h2><ul>${entries.map((o) =>
      `<li class="l${o.level}"><a href="#/study/${c.id}/${o.anchor || 'pdf' + o.pdfPage}"><span>${esc(o.title)}</span><span class="pg">${o.page ?? ''}</span></a></li>`).join('')}</ul></section>`;
  });
  root.innerHTML = `
    <h1>ICS Pub. 102</h1>
    <p class="muted">International Code of Signals, United States Edition, 1969 (revised 2020). Pick a section, or
      <a class="dl" href="ICS.pdf" download>download the printed edition</a>.</p>
    <div class="fulltoc">${sections.join('')}</div>`;
}

export async function chapter(root, id, anchor) {
  const t = await loadToc();
  const c = t.chapters.find((x) => x.id === id);
  if (!c) { root.innerHTML = '<p>Chapter not found. <a href="#/study">Back</a></p>'; return; }
  root.innerHTML = `
    <div class="study has-toc">
      <nav class="toc" aria-label="Table of contents">${tocHtml(t, id)}</nav>
      <article class="manual" id="manual"><p class="muted">Loading…</p></article>
    </div>`;
  const html = await loadChapter(id);
  const m = root.querySelector('#manual');
  m.innerHTML = html;
  const idx = t.chapters.indexOf(c);
  const prev = t.chapters[idx - 1], next = t.chapters[idx + 1];
  m.insertAdjacentHTML('beforeend', `<div class="chapnav">${prev ? `<a href="#/study/${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a href="#/study/${next.id}">${esc(next.title)} →</a>` : ''}</div>`);
  // Cross-references written as "#/study/page/N" are resolved by the router; make them in-chapter jumps when possible.
  m.addEventListener('click', (ev) => {
    const img = ev.target.closest('figure a.zoom');
    if (img) { ev.preventDefault(); showLightbox(img.getAttribute('href')); }
  });
  if (anchor) {
    const el = m.querySelector(`#${CSS.escape(anchor)}`);
    if (el) { el.scrollIntoView(); const n = el.classList.contains("pageno") ? el.nextElementSibling?.nextElementSibling : el; (n || el).classList.add("flash"); setTimeout(() => (n || el).classList.remove("flash"), 2500); }
  } else window.scrollTo(0, 0);
}

export async function page(root, n) {
  const t = await loadToc();
  const c = n >= 1 ? chapterForPage(t, n) : t.chapters.find((x) => x.id === 'international-flags-and-pennants');
  if (!c) { root.innerHTML = `<p>Page ${esc(n)} is not in the manual. <a href="#/study">Back</a></p>`; return; }
  // Replace the URL without adding history, then render the chapter at the page anchor.
  history.replaceState(null, '', `#/study/${c.id}/p${n}`);
  return chapter(root, c.id, n >= 1 ? `p${n}` : null);
}

function showLightbox(src) {
  const lb = document.getElementById('lightbox');
  lb.querySelector('img').src = src;
  lb.hidden = false;
}
