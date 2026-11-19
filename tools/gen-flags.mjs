// Generates docs/assets/flags/<id>.svg from tools/flags.mjs.
// Usage (from the repo root): node tools/gen-flags.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FLAGS, SHAPES } from './flags.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs', 'assets', 'flags');
mkdirSync(outDir, { recursive: true });

for (const [id, f] of Object.entries(FLAGS)) {
  const s = SHAPES[f.shape];
  const clip = `c-${id}`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.5 -0.5 ${s.w + 1} ${s.h + 1}" role="img" aria-label="Flag ${id}">` +
    `<defs><clipPath id="${clip}"><polygon points="${s.poly}"/></clipPath></defs>` +
    `<g clip-path="url(#${clip})">${f.body}</g>` +
    `<polygon points="${s.poly}" fill="none" stroke="#8a8f98" stroke-width="0.5"/>` +
    `</svg>\n`;
  writeFileSync(join(outDir, `${id}.svg`), svg);
}
console.log(`wrote ${Object.keys(FLAGS).length} flags to ${outDir}`);
