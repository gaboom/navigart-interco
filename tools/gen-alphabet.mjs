// Generates docs/data/alphabet.json: the 26 letters and 10 numerals with flag, Morse, phonetic text and single-letter meaning.
// Facts verified against Pub. 102 (2020):
//   flags            PDF p.2
//   Morse            printed p.16 (PDF p.21)
//   letter spelling  printed p.17 (PDF p.22)
//   figure spelling  printed p.18 (PDF p.23)
//   single letters   printed p.21 (PDF p.26) -- note: the table has NO entry for R.
// Structure: language-neutral facts at the top, per-language text under `text.<lang>` (SPEC I7).
// Usage (from the repo root): node tools/gen-alphabet.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MORSE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---',
  K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-',
  U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', 0: '-----',
};

// [word, pronunciation]
const LETTER_SPELLING = {
  A: ['Alfa', 'AL FAH'], B: ['Bravo', 'BRAH VOH'], C: ['Charlie', 'CHAR LEE (or SHAR LEE)'], D: ['Delta', 'DELL TAH'],
  E: ['Echo', 'ECK OH'], F: ['Foxtrot', 'FOKS TROT'], G: ['Golf', 'GOLF'], H: ['Hotel', 'HOH TELL'],
  I: ['India', 'IN DEE AH'], J: ['Juliett', 'JEW LEE ETT'], K: ['Kilo', 'KEY LOH'], L: ['Lima', 'LEE MAH'],
  M: ['Mike', 'MIKE'], N: ['November', 'NO VEM BER'], O: ['Oscar', 'OSS CAH'], P: ['Papa', 'PAH PAH'],
  Q: ['Quebec', 'KEH BECK'], R: ['Romeo', 'ROW ME OH'], S: ['Sierra', 'SEE AIR RAH'], T: ['Tango', 'TANG GO'],
  U: ['Uniform', 'YOU NEE FORM (or OO NEE FORM)'], V: ['Victor', 'VIK TAH'], W: ['Whiskey', 'WISS KEY'],
  X: ['X-ray', 'ECKS RAY'], Y: ['Yankee', 'YANG KEY'], Z: ['Zulu', 'ZOO LOO'],
};

// digit: [plain word, ICS code word, pronunciation]
const FIGURE_SPELLING = {
  0: ['Zero', 'Nadazero', 'NAH-DAH-ZAY-ROH'], 1: ['One', 'Unaone', 'OO-NAH-WUN'], 2: ['Two', 'Bissotwo', 'BEES-SOH-TOO'],
  3: ['Three', 'Terrathree', 'TAY-RAH-TREE'], 4: ['Four', 'Kartefour', 'KAR-TAY-FOWER'], 5: ['Five', 'Pantafive', 'PAN-TAH-FIVE'],
  6: ['Six', 'Soxisix', 'SOK-SEE-SIX'], 7: ['Seven', 'Setteseven', 'SAY-TAY-SEVEN'], 8: ['Eight', 'Oktoeight', 'OK-TOH-AIT'],
  9: ['Nine', 'Novenine', 'NO-VAY-NINER'],
};

// Single-letter signals, printed p.21. `sound` = marked with * (sound signals subject to the collision regulations, note 1).
// R has no entry in this table.
const SIGNALS = {
  A: ['I have a diver down; keep well clear at slow speed.'],
  B: ['I am taking in, or discharging, or carrying dangerous goods.', true],
  C: ['Yes (affirmative or "The significance of the previous group should be read in the affirmative").', true],
  D: ['Keep clear of me; I am maneuvering with difficulty.', true],
  E: ['I am altering my course to starboard.', true],
  F: ['I am disabled; communicate with me.'],
  G: ['I require a pilot. When made by fishing vessels operating in close proximity on the fishing grounds it means: "I am hauling nets".', true],
  H: ['I have a pilot on board.', true],
  I: ['I am altering my course to port.', true],
  J: ['I am on fire and have dangerous cargo on board: keep well clear of me, or I am leaking dangerous cargo.'],
  K: ['I wish to communicate with you.'],
  L: ['You should stop your vessel instantly.'],
  M: ['My vessel is stopped and making no way through the water.'],
  N: ['No (negative or "The significance of the previous group should be read in the negative"). This signal may be given only visually or by sound. For voice or radio transmission the signal should be "NO".'],
  O: ['Man overboard.'],
  P: ['In harbor.—All persons should report on board as the vessel is about to proceed to sea. At sea.—It may be used by fishing vessels to mean: "My nets have come fast upon an obstruction". It may also be used as a sound to mean: "I require a pilot".'],
  Q: ['My vessel is "healthy" and I request free pratique.'],
  S: ['I am operating astern propulsion.', true],
  T: ['Keep clear of me; I am engaged in pair trawling.', true],
  U: ['You are running into danger.'],
  V: ['I require assistance.'],
  W: ['I require medical assistance.'],
  X: ['Stop carrying out your intentions and watch for my signals.'],
  Y: ['I am dragging my anchor.'],
  Z: ['I require a tug. When made by fishing vessels operating in close proximity on the fishing grounds it means: "I am shooting nets".', true],
};

const entries = [];
for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
  const [word, pron] = LETTER_SPELLING[ch];
  const sig = SIGNALS[ch];
  entries.push({
    id: ch,
    kind: 'letter',
    char: ch,
    flag: ch,
    morse: MORSE[ch],
    hasMessage: Boolean(sig),
    soundRestricted: Boolean(sig && sig[1]),
    text: { en: { word, pronunciation: pron, ...(sig ? { message: sig[0] } : {}) } },
    source: { letterSpelling: 22, morse: 21, ...(sig ? { singleLetter: 26 } : {}), flags: 2 },
  });
}
for (const d of '1234567890') {
  const [plain, word, pron] = FIGURE_SPELLING[d];
  entries.push({
    id: d,
    kind: 'numeral',
    char: d,
    flag: d,
    morse: MORSE[d],
    hasMessage: false,
    soundRestricted: false,
    text: { en: { word, plain, pronunciation: pron } },
    source: { figureSpelling: 23, morse: 21, flags: 2 },
  });
}

const pennants = [
  { id: 'S1', kind: 'substitute', flag: 'S1', text: { en: { word: '1st Substitute' } } },
  { id: 'S2', kind: 'substitute', flag: 'S2', text: { en: { word: '2nd Substitute' } } },
  { id: 'S3', kind: 'substitute', flag: 'S3', text: { en: { word: '3rd Substitute' } } },
  { id: 'CODE', kind: 'code', flag: 'CODE', text: { en: { word: 'Code / Answering pennant (or decimal point)' } } },
].map((p) => ({ ...p, source: { flags: 2 } }));

const out = { version: 1, edition: 'NGA Pub. 102, 1969 (Revised 2020)', languages: ['en'], entries: [...entries, ...pennants] };
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'data');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'alphabet.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`wrote ${out.entries.length} entries; letters with a message: ${entries.filter((e) => e.kind === 'letter' && e.hasMessage).length}`);
