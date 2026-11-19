// Shared: signal dataset, alphabet lookup, and the flag-hoist renderer.
import { load as loadAlphabet } from './browse.js';

let sig;
export async function loadSignals() {
  if (!sig) sig = await (await fetch('data/signals.json')).json();
  return sig.signals;
}

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Normalise user input: "mcz  3" -> "MCZ 3", "ae1" -> "AE 1". */
export function normCode(input) {
  const s = String(input).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const m = s.match(/^([A-Z]+)([0-9]*)$/);
  return m ? (m[2] ? `${m[1]} ${m[2]}` : m[1]) : s;
}

/** Flags for every character of a code, as an image row: letters/numerals with a gap before the complement. */
export async function hoist(code, { size = 'md' } = {}) {
  const alpha = await loadAlphabet();
  const byChar = new Map(alpha.entries.filter((e) => e.char).map((e) => [e.char, e]));
  const parts = String(code).split(' ');
  return `<div class="hoist ${size}" role="img" aria-label="Flag hoist ${esc(code)}">` + parts.map((p) =>
    `<span class="hgroup">${[...p].map((c) => byChar.has(c)
      ? `<span class="hflag"><img src="assets/flags/${c}.svg" alt=""><b>${c}</b></span>` : '').join('')}</span>`).join('') + '</div>';
}

/** Code spelled with the phonetic words: "MCU" -> "M – MIKE, C – CHARLIE, U – UNIFORM". */
export async function spell(code) {
  const alpha = await loadAlphabet();
  const byChar = new Map(alpha.entries.filter((e) => e.char).map((e) => [e.char, e]));
  return [...String(code).replace(/ /g, '')].map((c) => {
    const e = byChar.get(c);
    return e ? `${c} – ${e.text.en.word.toUpperCase()}` : c;
  }).join(', ');
}

export async function morseOf(code) {
  const alpha = await loadAlphabet();
  const byChar = new Map(alpha.entries.filter((e) => e.char).map((e) => [e.char, e]));
  return String(code).split(' ').map((p) => [...p].map((c) => byChar.get(c)?.morse || '').filter(Boolean));
}

/** Find a signal by exact code; falls back to the base code when a complement is added. */
export async function decode(input, chapter) {
  const all = await loadSignals();
  const code = normCode(input);
  const pool = chapter ? all.filter((s) => s.chapter === chapter) : all;
  const exact = pool.filter((s) => s.code === code);
  const m = code.match(/^([A-Z]+) ?([0-9]+)$/);
  const base = m ? pool.filter((s) => s.code === m[1]) : [];
  const prefix = code.length >= 1 ? pool.filter((s) => s.code.startsWith(code) && s.code !== code).slice(0, 12) : [];
  return { code, exact, base, complement: m ? m[2] : '', prefix };
}
