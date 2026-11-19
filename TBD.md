# TBD — known issues, limitations, untested, to be reconciled

Things we know are imperfect or unverified. Each entry says what, why it matters, and what would settle it.
Small actionable tasks are in [TODO.md](TODO.md).

## Extraction (PDF → HTML)
Measured with `python -I tools/verify_manual.py [--strict --verbose]`, which compares every page's HTML with the PDF text layer word by word.
Current result: 159 pages, about 39,000 words, **0.16% missing, 0.05% extra**, no page over tolerance.

- **Residual word differences (about 80 words).** Mostly words split across a page boundary (hyphenated at the bottom of one page, finished at the top of the next) and the same entry continuing across index pages. They are counted as differences per page but the content is present. Settle by pooling the comparison per chapter.
- **Printed contents pages are dropped on purpose** (chapter 1 p. 1, chapter 4 p. 134, others). The app builds its own table of contents. If we want a replica of the book's printed contents, they need their own rendering.
- **Reading order on unusual layouts.** Two-column text pages are read column by column (heuristic: three or more blocks on each side). Other multi-column layouts are not specially handled.
- **Tables are reconstructed from text positions.** Wrapped cells are folded back into the row above (heuristic: the continuation starts in lowercase and the previous text has no sentence end). A wrapped cell that starts with a capital or number would not fold. Check by eye on chapters 2 and 3.
- **Figures are PNG renders** of drawing clusters (170 dpi), not vector. 33 figures. The hand-flag and semaphore drawings are not individually captioned.
- **Footnote links:** asterisks in tables link to the page's `Notes` row or paragraph. Pages where the note is elsewhere, or where an asterisk has no note on the same page, are not linked.
- **Cross-references:** "page N" and "Chapter N" are linked. "Section N", "Table M-1" and "see signal XX" are not.
- **Index entries:** continuation lines are joined by indentation (heuristic). Spot-check a few pages against the PDF for wrapped entries and sub-entries.
- **Bookmark outline is slightly off** in places (the flags page). Page numbers were verified for the chapters, not for every one of the 180 entries.
- **Page numbering:** body pages are PDF page minus 5. The front matter has no printed number.

## Data
- `docs/data/alphabet.json`: letters, numerals, substitutes, code pennant. Morse and the single-letter table were checked against the PDF by eye. **R has no single-letter meaning** in the 2020 table.
- Flags are drawn from a hand-written spec and compared with PDF page 2 by eye (not pixel-compared). Colours are approximate.
- Not yet in the dataset: complements, icebreaker signals, procedure signals, the two-letter code and the medical code (the manual text has them, the structured data does not).

## Source of the PDF
- `docs/ICS.pdf` (2.2 MB) is the file downloaded from the official USCG host (`Pub102_2020.pdf`). The newer NGA original could not be fetched automatically. Compare against the NGA copy when convenient.
- The edition (1969, revised 2020) is the latest we found. Amendments after 2020 may exist.

## Untested
- Phone and tablet layouts beyond one screenshot at 390 px.
- Keyboard and screen-reader use.
- Safari, Firefox, mobile browsers.
- Offline use (no service worker yet).
- Morse audio on iOS (needs a user gesture; the Play button is one).

## Design and product
- Digit notation in the quiz (`TWO` / `BISSOTWO` / random) may change after playtesting.
- Progress tracking (trend line, history switch) is specified but not built.
- COLREG is a draft only (SPEC section 9). No work, no assets.
- Extra signals for v2 (smoke, body positions, object arrangements, night light Morse) need a redistributable source.
- Internationalization: the data keeps language-neutral facts apart from text, but the manual HTML is English only. Translating it needs a different source.

## Tooling
- `tools/extract_manual.py` needs PyMuPDF; no `requirements.txt` yet. Regeneration takes about a minute.
- Dev server is `py -m http.server`; there is no automated test run.
- Playwright screenshots were done ad hoc and are not part of the repository.

## v1 / v2 features (added with the first implementation)
- **Signals dataset topics:** `group` and `topic` come from heading text. Headings of three letters or fewer (for example "ICE") are treated as stray code labels and skipped, so a few signals sit under a neighbouring topic. Spot-check Medico and Interco topic lists.
- **Complements** (the numbers after a code, for example `MCZ 3`) are explained only as "see the manual page"; the complement tables are not yet structured data.
- **Quiz accessibility:** flag options have no text alternative on purpose (it would give the answer away); a non-visual way to take the flag quizzes is undecided.
- **Quiz distractors** are random within the same kind, except Morse (closest by edit distance). Flag look-alikes are not modelled.
- **Quiz progress and history** are not stored yet (SPEC I6). Only the last settings are kept in `localStorage`.
- **Interco** covers the General Signal Code only. Signals with complements, icebreaker and procedure signals are not in the dataset.
- **Morse playback** of a whole code uses fixed timing (unit 90 ms); no speed control.
- **Medico** has search by words and by topic and a decode view; it does not walk a symptom decision tree and does not compose a full message (for example a code plus its complements) yet.

## Quiz UX (phone pass)
- Message options are truncated to about 90 characters (first sentence); the full text is shown in the feedback bar and the review. Two messages that start with the same sentence ("I require a pilot." / "I require a tug.") stay distinguishable, but this was only checked by eye.
- Auto-continue after a correct answer is on by default (1.1 s, can be switched off in the setup). Whether it feels right needs real use.
- The quiz header (score, stop) and the feedback bar are tested with Playwright on an iPhone 13 viewport, not on a device.
