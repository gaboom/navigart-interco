# Interco — Engineering and Agent Guide (How?)

> **Map**: **Why?** [SPEC.md](SPEC.md) · **What?** [README.md](README.md) · **How?** [AGENTS.md](AGENTS.md)
> Status: **DRAFT.** Decisions below are the working defaults. Anything marked `[OPEN]` needs confirmation.

Follow these invariants when changing the app. Keep the three documents consistent: requirements and rationale go to SPEC.md, user-facing description to README.md, technical decisions and quirks here.

## 1. Decisions

| Topic | Decision | Reason |
|---|---|---|
| Hosting | GitHub Pages, served from **`docs/`** (as in the sibling `navigart-deviator`). Custom domain `interco.navigart.net` via `docs/CNAME`. | Specs stay at the repo root, the site is isolated. |
| Build | **None.** Plain HTML, CSS and ES modules, no bundler. | SPEC P1. |
| Routing | Hash routing (`#/study/...`, `#/browse/...`). | Pages has no server rewrite. |
| Data | JSON files in `docs/data/`, loaded lazily per chapter and per type. | SPEC P5, N6. |
| Offline | `manifest.json` plus a service worker with a versioned precache. | SPEC P2, N1. |
| Flags | Defined as a data spec (`tools/flags.mjs`: outline shape + coloured shapes), generated into static SVG files in `docs/assets/flags/` by `node tools/gen-flags.mjs`. The generated files are committed. They are not extracted images. | Crisp, small, no reproduction issues, and the app just references files. |
| Morse | Generated from the code text, with audio via Web Audio. Never stored. | SPEC D4. |
| Voice | Web Speech API, optional, online-only, feature-detected and clearly labelled. | SPEC I3, N5. |
| Layout | Responsive. Single column on phones, wide layout with sticky TOC on desktop. Sizing with container units, no orientation lock. | SPEC P7, N2. |
| Theme | Day theme. All colours are CSS custom properties on `:root` so a night theme (red on black) is a later override. | SPEC N4. |
| Language | English strings in one module or JSON, no hard-coded text in logic. Data records split into language-neutral fields (id, code, flag spec, Morse) and per-language text (`text.en`, later `text.<lang>`), so adding a language adds data, not code. | SPEC P8, I7. |
| Local state | `localStorage` only, versioned keys, wrapped in try/catch, and the app works without it. | SPEC P4. |

## 2. Proposed layout

```
docs/
  index.html
  CNAME
  manifest.json
  sw.js
  ICS.pdf              the single downloadable PDF
  css/                 tokens (CSS variables), layout
  js/                  router, views, quiz engine, renderers (flag, morse)
  data/                signals, flags, chapters (generated, verified)
tools/                 one-off processing scripts (PDF to data/HTML), not served
```

There are no mocks. We write the real app directly in `docs/`, so the prototype is the production code. If a build step is ever needed, the app moves to a source folder and builds into `docs/`.

## 3. Source handling
- Primary source: NGA Pub. 102 (1969, Revised 2020), at `docs/ICS.pdf`. It is the file the maintainer downloaded from the official USCG host (`Pub102_2020.pdf`), renamed. SHA-256: `aea37c23bf25aef70307207e2e0d244df0b3c0ac2e2e1c3aa66d546124856556`.
- The PDF has a real text layer (158 pages, about 58k words). Extraction uses `pdftotext` and scripts under `tools/`. Scripts run from outside the folder that holds downloaded files, and Python reads untrusted files with `-I`.
- Processing steps (the implementation plan starts here): inspect structure, extract text and figures per chapter, build the table of contents, normalise, resolve cross-references, generate the dataset, then verify counts and spot-check against the PDF.
- Every record keeps its source page. Corrections to extraction are recorded.
- Third-party content needs a recorded licence (SPEC P3).

### Generators and findings so far
- `node tools/gen-flags.mjs` writes the 40 flag SVGs (26 letters, 10 numeral pennants, 3 substitutes, code/answering pennant). They were compared with PDF page 2 side by side. Test them with a renderer that supports `clipPath` (PyMuPDF's SVG import does not; resvg does).
- `node tools/gen-alphabet.mjs` writes `docs/data/alphabet.json` (letters and numerals: flag, Morse, phonetic word and pronunciation, single-letter message, with PDF page references). Morse was checked against PDF page 21 and the single-letter table against page 26.
- The single-letter table (printed p. 21) has no entry for **R**. R and the digits have no message, so quizzes that use `message` exclude them.
- PDF page number = printed page number + 5. Cross-references in the text use printed numbers, and records store PDF pages.
- The PDF's bookmark outline (180 entries) gives the table of contents, but at least one bookmark is off (the flags page).
- Table extraction needs positions (PyMuPDF), because plain text extraction scrambles ruled tables.

### Dev workflow
- Serve locally (modules and `fetch` need http, not `file://`): `py -m http.server 8080 --bind 127.0.0.1` from `docs/`.
- Regenerate the manual: `python -I tools/extract_manual.py` (needs PyMuPDF). It rewrites `docs/data/manual/` and `docs/assets/fig/`. Delete both folders first so stale files don't linger.
- Screenshots for review: Playwright (Chromium) against the local server. In Git Bash, never pass a bare `#/route` argument (MSYS rewrites it to a Windows path); pass the route without `#/` and add the prefix in the script.
- The shell uses an icon rail on the left in landscape and a bottom tab bar in portrait. Feature icons are placeholders in `docs/js/icons.js`; COLREG has none (draft only). The PDF is not in the menu; it is offered from Study and Browse.
- Known extraction limits: wrapped table cells sometimes become two rows (for example long meanings in chapter 2); the two index chapters are still scrambled (two columns); printed contents lists are dropped on purpose because the app builds its own table of contents.

### Data and modules (built so far)
- `docs/data/alphabet.json`: letters, numerals, pennants (`tools/gen-alphabet.mjs`).
- `docs/data/signals.json`: 1,345 general and 445 medical signals, each with code, meaning, group, topic, page (`python -I tools/gen_signals.py`, parses the extracted chapter HTML). No duplicate codes. Group and topic come from the manual's headings and are imperfect where a heading is three letters or fewer.
- `docs/data/manual/`: the manual as HTML plus `toc.json` (`tools/extract_manual.py`).
- JS modules: `app.js` (router), `study.js`, `browse.js`, `quiz.js` (pool, distractors, question flow), `codes.js` (Medico and Interco explorer, decode view), `signals.js` (dataset, flag-hoist renderer, spelling), `morse.js` (visual and audio), `icons.js`.
- Quiz rules: X and O differ; pool is letters and numerals; message quizzes use only the 25 letters that have a message (numerals and R have none). Distractors are other entries of the same kind; for Morse the 8 closest by edit distance.
- Verify the manual extraction after any change to the extractor: `python -I tools/verify_manual.py` (add `--strict --verbose` for every difference). It must report no page over tolerance.

## 4. Quality gates
- Every internal link and cross-reference resolves (a script checks this).
- Counts per chapter in the dataset match the PDF.
- Offline test: load once, go offline, every view still works.
- Phone width (360 px) and wide desktop checks. Keyboard-only pass.
- Do not build anything for COLREG (SPEC §9).

### Lesson: CSS appended from the shell
A truncated `printf`/heredoc once left an unclosed rule in `docs/css/app.css`; CSS nesting then swallowed every rule appended after it, silently. Edit the stylesheet with the editor tools, not shell appends, and check the phone layout again after any CSS change (`mob.mjs`-style Playwright run: overflow check plus screenshots).
