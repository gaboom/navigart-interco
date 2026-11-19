# TODO — small tasks

## Where we left off (end of session)
- **Built and working locally:** Study (manual as linked HTML, indexes linked, footnote and page links), Browse (flags, Morse, phonetic), Quiz (one-screen layout, auto-continue), Medico and Interco (search, topics, decode any code).
- **Verified:** manual extraction compared with the PDF word by word (`python -I tools/verify_manual.py`): 0.16% missing, 0.05% extra. Phone layout checked in Playwright only.
- **Not built:** Train, progress trend and history switch, service worker and install, translations, extra signal types, COLREG (draft only).
- **Next steps, in order:** (1) real-phone pass, (2) service worker + manifest for offline, (3) Train and progress, (4) extra signals once a source is chosen. Open decisions are in [TBD.md](TBD.md).
- **Run it:** `cd docs && py -m http.server 8080`, open http://127.0.0.1:8080. Regenerate data with the scripts listed in [AGENTS.md](AGENTS.md).
- **Not yet published:** GitHub Pages is not switched on; set the source to `/docs` (custom domain interco.navigart.net via a `docs/CNAME`, not created yet).

Small, concrete tasks. Larger decisions and known problems live in [TBD.md](TBD.md); requirements in [SPEC.md](SPEC.md).
Mark done with `[x]` and delete when the list gets long.

## Testing
- [ ] Test on a real phone (portrait, 360 px): Study table of contents, manual text, Browse grid, bottom tab bar
- [ ] Keyboard-only pass: tab order, visible focus, Esc closes the figure viewer, skip link to the main content
- [ ] Screen reader pass: flag images have text alternatives, table headers, nav landmarks
- [ ] Test offline once the service worker exists (load once, go offline, every view works)
- [ ] Test Safari and Firefox (module scripts, `CSS columns`, `100dvh`)
- [ ] Test at 4K and 8K width: manual text measure, Browse grid, index columns

## App shell
- [ ] Add the service worker and manifest (installable, offline) with a generated precache list
- [ ] Add a skip link and set the page title per view
- [ ] Remember the last Study position (SPEC S6)
- [ ] Night theme override (red on black), colours are already CSS variables
- [ ] Favicon and app icons

## Study
- [ ] Full-text search over the manual (SPEC S5): generate a small index in `tools/`
- [ ] Link "Section N" references (needs section anchors) and "Table M-1" references
- [ ] Show a "back to where I came from" link after following a cross-reference
- [ ] Footnote asterisks outside the single-letter table (chapter 2 pages) link to that page's note when there is one
- [ ] Hide the empty `page NN` marker on blank continuation pages
- [ ] Figures: add a caption from the nearest heading; test the enlarge viewer with keyboard

## Browse
- [ ] Source line: show printed pages only once, link each to the manual
- [ ] Show the 3 substitutes and the code pennant in their own section with a short explanation from the manual
- [ ] Numeral notation toggle `TWO` / `BISSOTWO` / random (SPEC B5)

## Data
- [ ] Add single-letter signals with complements, icebreaker signals and procedure signals (AR, AS, AAA) to the dataset
- [ ] Add a data check script (counts per chapter, every cross-reference resolves)

## Docs
- [ ] Add the SHA-256 of `docs/ICS.pdf` to AGENTS.md when it is committed (already recorded)
- [ ] Keep SPEC, README and AGENTS consistent after each feature

## From the first phone pass (iPhone 13 viewport in Playwright, 390 px)
- [x] Quiz: whole question on one screen, feedback bar always visible, auto-continue after a correct answer, running score, Start pinned above the tab bar
- [ ] Real-device pass (iOS Safari and Android Chrome): touch targets, 100dvh with the browser bars, Morse audio needs a first tap
- [ ] Manual tables on phones: merge the two code columns (code and sub-code) into one so the meaning column gets the width
- [ ] Hide empty `page NN` markers (blank continuation pages stack up in chapter 2)
- [ ] Quiz: show a streak or best score on the setup screen once progress storage exists (SPEC I6)
- [ ] Quiz: swipe or tap anywhere to continue after a wrong answer; consider a "show me again later" repeat of missed items in the same session
- [ ] Quiz: long messages are shortened to the first sentence in the options (full text in the feedback); check that no two options end up identical
- [ ] Medico and Interco: the decode view on phones (flags row wraps; check long codes like `MCZ 123`)
