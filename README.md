# Interco (`navigart-interco`)

> **Live app**: [interco.navigart.net](https://interco.navigart.net)
> **Map**: **Why?** [SPEC.md](SPEC.md) · **What?** [README.md](README.md) · **How?** [AGENTS.md](AGENTS.md)

**Interco** is a free, offline, installable trainer for the **International Code of Signals** (ICS). It runs in any browser on a phone or desktop, with no account and no server.

> **Status** (work in progress, not published yet): v0 Study and Browse and v1 Quiz and Medico run. The first half of v2 (Interco: find or decode any general signal) runs too. Still to do: Train, progress tracking, extra signal types, offline install, translations. See [TODO.md](TODO.md) and [TBD.md](TBD.md).

## What you get

### v0 — Study and browse
- **STUDY**: the full ICS manual (US edition Pub. 102) as readable pages with a working table of contents, cross-links and enlargeable figures. The original PDF is available as a download.
- **BROWSE**: a library of flags, pennants, codes, Morse and meanings. Look up any entry and see all its forms together.

### v1 — Quiz and Medico
- **QUIZ**: pick what you are shown and what you answer (two different ones of flag, code like `A – ALPHA`, Morse or message), choose 5, 10 or 20 questions, and answer a random four-option quiz on single-letter signals.
- **MEDICO**: find the right Medical Signal Code message to send by searching or browsing, or enter a code and get its meaning.

### v2 — Interco and Train
- **INTERCO**: the General Signal Code. Search it by topic or by what you want to say, or enter any code and get every form of the signal (flags, spelling, Morse, meaning).
- **Progress**: a simple trend of your recent quiz attempts and success rate, to keep you motivated. It stays on your device.
- **TRAIN**: practise spelling signals (with optional voice recognition, which needs a connection), substitutes, and special procedures such as SOS, ground-to-air and search-and-rescue signals.

### v3 — COLREG (draft, not planned yet)
Ship lights and signals with a trainer. Described in the spec only.

## Principles
Free, static, offline after first load, no login, no tracking. Content comes from public-domain sources first.

## Source
Content is based on *International Code of Signals, US Edition, 1969 (Revised 2020)*, NGA Pub. 102, a US Government publication with no copyright claimed. The PDF in this repo is that edition.

## Development
See [AGENTS.md](AGENTS.md).
