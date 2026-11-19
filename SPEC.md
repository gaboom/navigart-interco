# Interco — Specification (Why?)

> **Map**: **Why?** [SPEC.md](SPEC.md) · **What?** [README.md](README.md) · **How?** [AGENTS.md](AGENTS.md)
> Status: **DRAFT for review.** Items tagged `[OPEN]` are unresolved questions; items tagged `[DRAFT-ONLY]` are parked and must not be built.

## 1. Purpose and rationale

The International Code of Signals (ICS) is the one maritime communication standard that works when radio fails and when crew share no language. Few sailors can use it, because the manual is a 158-page PDF made for reference, not learning, and recall under stress needs practice.

**Interco** turns the manual into a free, offline, installable trainer. It exists to (WHY):

1. **Make the manual readable** on a phone, in a cockpit or at a desk (v0).
2. **Make the knowledge browsable**: flags, codes, Morse and meanings in one place, where the PDF scatters them (v0).
3. **Make recall automatic** through quizzes and fast look-up of the right signal (v1).
4. **Cover the rest of the practice**: other codes, procedures, spelling and emergencies (v2).
5. **Cost nothing and keep nothing**: no accounts, no backend, no tracking, so it works at sea and in a classroom.

## 2. Principles (constraints that decide trade-offs)

| # | Principle | Rationale |
|---|---|---|
| P1 | **Static and no build.** Plain files in `docs/`, served by GitHub Pages. | Zero cost, zero infrastructure, no toolchain rot. |
| P2 | **Offline-first.** After the first load, everything works without a network (installable PWA). | Users are often on a boat. |
| P3 | **Public-domain sources first.** The primary source is NGA Pub. 102 (US Government work, no copyright claimed). Any other source must have a licence that allows redistribution, recorded per item. | Redistribution risk is avoided. |
| P4 | **No login, no backend, no telemetry.** Any progress data stays in the browser and can be exported. | Privacy and simplicity. |
| P5 | **Data over code.** Signals, flags and codes are structured data. The UI, quizzes and look-ups are generic views of that data. | One verified dataset feeds every feature. |
| P6 | **Faithful to the source.** Every signal carries its page reference. Structured data is verified against the PDF, and corrections are noted. | A trainer that teaches wrong signals is worse than none. |
| P7 | **Simple, responsive layout.** Phone column to 8K desktop, container-unit scaling, no orientation lock. | Readable everywhere. |
| P8 | **English first, translatable later.** UI strings and signal text are separate from logic. | The ICS is authoritative in English. |

## 3. Roadmap

| Version | Scope | Depends on |
|---|---|---|
| **v0** | **STUDY** (the manual as linked HTML) + **BROWSE** (library of flags, codes, Morse, meanings) | PDF processing, dataset |
| **v1** | **QUIZ** + **MEDICO** | v0 dataset and renderer |
| **v2** | **INTERCO** (other codes, evaluate codes, any-code look-up) + **TRAIN** (spelling with voice, substitutes, special meanings and procedures such as SOS, ground-to-air, SAR; extended signal types). Optional progress tracking. **Internationalization** (additional UI and content languages). | v1 |
| **v3** | **COLREG** — `[DRAFT-ONLY]`, see §9 | v2 |

Versions ship independently and are each usable on their own.

## 4. v0 — STUDY and BROWSE

### 4.1 STUDY (requirements)
- **S1** The whole of Pub. 102 is readable as structured HTML, with the same chapter and section order as the PDF.
- **S2** A table of contents covers all levels. Every TOC link, in-text cross-reference and "see Section X" reference works, and the URL of a section can be shared.
- **S3** Figures and flag/table images can be enlarged (tap or click for a full-screen viewer, zoom and pan).
- **S4** The original PDF is offered as a single download. *Why:* some users want the paper-faithful reference.
- **S5** Full-text search across the manual.
- **S6** The reading position is remembered locally (convenience only).

### 4.2 BROWSE (requirements)
- **B1** A library of entries by type: single-letter flags, numeral pennants, substitutes, answering pennant, other codes in the manual, Morse, phonetic alphabet, and the signal codes with their meanings.
- **B2** Every entry shows what applies: flag image, code, Morse (visual and audible), phonetic form, meaning, and the manual page reference with a link into STUDY.
- **B3** Filter and search by letter, code, meaning text and category.
- **B5** Numerals are shown in both notations, `2 – TWO` and `2 – BISSOTWO`, in the library (BROWSE), with a three-way toggle (`TWO` / `BISSOTWO` / random) that also drives the quiz (Q5).
- **B4** Flags are rendered from a data spec (shapes and colours), which keeps them crisp at any size, small to ship, and free of reproduction concerns. They are checked against the PDF.

## 5. v1 — QUIZ and MEDICO

### 5.1 QUIZ
- **Q1** Before starting, the user picks the question type X and the answer type O from `{flag, code, morse, message}`, and the length from `{5, 10, 20}`. **X and O must differ** (12 ordered pairs): with the same type, the answer would be visible in the question and the quiz would be trivial.
- **Q2** Each question shows one X and four options of type O. Exactly one option is the entry that X belongs to, and the question order is random.
- **Q3** Distractors are other entries of the same pool, plausible where possible (similar-looking flags, similar Morse). They are never duplicates of the answer.
- **Q4** At the end the user sees the score and the mistakes with the correct answer, then can retry or choose again.
- **Q5** The quiz uses **single-character signals only**. The four types mean: **flag** = the flag image, **code** = the letter with its phonetic word, as in `A – ALPHA`, **morse** = the dot-dash pattern, **message** = the meaning of the single-letter signal. Letters A–Z have all four. Numerals 0–9 have no message, so they join the pool only when neither X nor O is `message`. Numerals support both notations, `2 – TWO` and `2 – BISSOTWO` (the ICS numeral words).

### 5.2 MEDICO (Medical Signal Code)
- **M1** *Find the message to send:* a UX-friendly search and a browse tree of the medical code, by topic (symptoms, body part, treatment, advice), leading to the exact code, with the flag/Morse rendering of the result.
- **M2** *Translate a code:* the user enters a medical code and gets its meaning, and the related composed phrases where the code takes a complement.
- **M3** The complements and the way a signal is built up (code plus numeral) are explained where the manual defines them.

## 6. v2 — INTERCO and TRAIN

- **I1** Browse the other codes in the manual (for example distress, SAR, and the one-letter and two-letter signal sets).
- **I2** *Evaluate a code:* the user enters any code and sees the meaning, the flag hoist, Morse, the phonetic form, and all other representations the manual defines (flashing, sound, semaphore, and others as in §7).
- **I3** TRAIN, spelling: the user is shown a signal and must spell it, by typing or by voice. Voice recognition is optional and online-only (it depends on a browser cloud service), clearly labelled, and every other feature works offline.
- **I4** TRAIN, procedures: substitutes, special meanings and sequences (SOS, ground-to-air and SAR signals, and similar), as short drills.
- **I5** Extended signal types beyond flags are added only from sources that pass principle P3. Planned kinds:
  - **Body and flag positions:** a flag or the arms held in a defined position, shown as an illustration.
  - **Object arrangements:** two or more objects (balls, cones, flags) arranged in a defined way, shown as an illustration.
  - **Night light Morse:** an animation of a light flashing a signal in Morse, purely visual (audio is separate and optional).
  - Further kinds such as smoke and ground-to-air panels when a source qualifies.
- **I7** Internationalization: more languages can be added without code changes. From v0 the data model keeps language-neutral facts (code, flag, Morse) apart from language-specific text (meanings, UI strings, phonetic words, manual text), keyed by language. The first language is English, and v2 delivers the switching UI and the first additional language. `[OPEN]` which language comes first, and whether official ICS translations are available as public-domain sources.
- **I6** Progress feedback: a trend line of quiz attempts and the success rate. The trend itself is the motivation (show, don't tell): no quotes, no badges, no streak text. It is stored locally in the browser, with no export, no accounts and no leaderboards.
  - **Default (history off):** a fixed 14-day window that can't be changed. The page states: *"All data is stored locally and will be erased after 14 days."* Older data is deleted automatically.
  - **Enable history:** an opt-in switch that keeps data without a time limit and unlocks the view window: forever, 1 year, 1 month, 14 days, 7 days, 5 days, 1 day. The window only filters what is shown; all data is kept.
  - **Disable history:** shows a warning that all data older than 14 days will be deleted, and deletes it only after confirmation.

## 7. Content and data requirements
- **D1** One structured dataset (JSON) is the source for STUDY cross-links, BROWSE, QUIZ, MEDICO and INTERCO.
- **D2** Each entry has a stable id, type, code, meaning, representations, source reference (page and section) and licence/source tag.
- **D3** The dataset is checked for completeness against the PDF (counts per chapter) and for internal consistency (for example every cross-reference resolves).
- **D4** Morse is generated from the code, not stored separately, so it can't drift.

## 8. Non-functional requirements
- **N1** Works offline after first load, and is installable (PWA).
- **N2** Fully usable on a phone (about 360 px) and on desktop up to 8K, with text sized from container units.
- **N3** Accessible: keyboard operable, sufficient contrast, flags have text alternatives (letter, name and colours).
- **N4** Day theme in v0. A night theme (red on black, for night vision) is specified for later, and every colour is a CSS variable so it can be added without restructuring.
- **N5** No network calls at runtime other than the optional voice feature.
- **N6** Size is not a constraint. The manual is still split by chapter so the first view appears quickly, but there is no size budget.
- **N7** Privacy: nothing leaves the device. The progress page states how long data is kept (I6).

## 9. v3 — COLREG `[DRAFT-ONLY, NOT SCHEDULED, DO NOT BUILD]`

**Intent (high level):** teach ship lights, shapes and sound/light signals from the collision-avoidance rules (COLREG), with a trainer in the same style as QUIZ (identify a vessel from its lights, and the reverse).

**Rules for now:**
- No implementation, no asset downloads and no dataset until this section is promoted out of draft.
- Sources may be read for understanding only.
- It reuses the v1 quiz engine and the data-driven renderer (principles P5 and P1), so v0–v2 must not make that impossible, but nothing is built for it.

**Open questions before promotion:** which rules edition and source, whether it is a module of this app or a separate app, which vessel types are in scope, and how lights are rendered (SVG scene, light patterns).

## 10. Open questions (to resolve before building)
1. `[OPEN]` **Digit notation in the quiz:** a toggle with three states: `TWO`, `BISSOTWO` and random. This may change after playtesting.
2. `[OPEN]` **Extra sources** for extended signals in v2: which are acceptable under P3.

Resolved: quiz pairs must differ; the quiz uses single characters only; STUDY search is full text; progress is local with no export; the repository licence is CC0, which fits the public-domain content.

## 11. Success criteria
- v0: every TOC and cross-reference link resolves; every flag in the manual renders and matches the PDF; the app works with the network off.
- v1: a quiz of any type pair can be completed offline; MEDICO finds a code for a plain-language phrase and the reverse.
- v2: any valid code evaluates to all its representations; the voice feature degrades gracefully without a network.
