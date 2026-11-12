/**
 * Render the all-forms sheet for the README: the 10 Goku forms in two rows,
 * each with its level, name, saga and lifetime contribution range.
 *
 * Usage: npm run forms-sheet  ->  docs/forms.svg
 */
import fs from 'node:fs';
import path from 'node:path';
import { GOKU_FORMS } from '../src/engine/forms.js';
import { calculateAuraFromStreak } from '../src/engine/streak.js';
import { CANVAS_HEIGHT, CANVAS_WIDTH, renderCharacterFrames } from '../src/art/index.js';
import { encodePng } from '../src/art/png.js';

const COLUMNS = 5;
const CELL_W = 176;
const CELL_H = 290;
const GAP = 12;
const PAD = 24;
const HEADER = 64;
const WIDTH = PAD * 2 + COLUMNS * CELL_W + (COLUMNS - 1) * GAP;
const HEIGHT = HEADER + PAD + 2 * CELL_H + GAP;
/** Canvas region around the figure (with its aura) shown in each cell. */
const CROP = { x: 22, y: 2, w: 84, h: 112 };
const FONT = "'Segoe UI', system-ui, -apple-system, Helvetica, Arial, sans-serif";

const esc = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const range = (min: number, max: number) =>
  Number.isFinite(max) ? `${min.toLocaleString('en-US')} – ${max.toLocaleString('en-US')}` : `${min.toLocaleString('en-US')}+`;

const cells = GOKU_FORMS.map((form, index) => {
  const column = index % COLUMNS;
  const row = Math.floor(index / COLUMNS);
  const x = PAD + column * (CELL_W + GAP);
  const y = HEADER + row * (CELL_H + GAP);
  // A lively but not maxed-out look: flaring aura, middle power-up stage.
  const frame = renderCharacterFrames(form, calculateAuraFromStreak(5, form.hasSparks), 1)[0];
  const png = encodePng(frame, 2).toString('base64');
  const spriteW = CELL_W - 16;
  const spriteH = 206;
  const accent = form.auraColors.primary;
  return `
  <g>
    <rect x="${x}" y="${y}" width="${CELL_W}" height="${CELL_H}" rx="14" fill="#151129" stroke="${accent}" stroke-opacity="0.35" />
    <ellipse cx="${x + CELL_W / 2}" cy="${y + 200}" rx="58" ry="9" fill="${accent}" opacity="0.18" />
    <svg x="${x + 8}" y="${y + 8}" width="${spriteW}" height="${spriteH}" viewBox="${CROP.x} ${CROP.y} ${CROP.w} ${CROP.h}" preserveAspectRatio="xMidYMax meet">
      <image width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" style="image-rendering:pixelated" href="data:image/png;base64,${png}" />
    </svg>
    <rect x="${x + 10}" y="${y + 10}" width="38" height="18" rx="9" fill="${accent}" fill-opacity="0.2" stroke="${accent}" stroke-opacity="0.6" />
    <text x="${x + 29}" y="${y + 23}" fill="#ffffff" font-size="10" font-weight="800" text-anchor="middle">LV ${index + 1}</text>
    <text x="${x + CELL_W / 2}" y="${y + 236}" fill="#ffffff" font-size="14" font-weight="900" font-style="italic" text-anchor="middle">${esc(form.name)}</text>
    <text x="${x + CELL_W / 2}" y="${y + 254}" fill="#a78bfa" font-size="10" text-anchor="middle">${esc(form.saga)}</text>
    <text x="${x + CELL_W / 2}" y="${y + 276}" fill="${accent}" font-size="12" font-weight="800" text-anchor="middle">${range(form.minContributions, form.maxContributions)}</text>
  </g>`;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="${FONT}" role="img" aria-labelledby="forms-title">
  <title id="forms-title">All 10 git-saiyan forms with their lifetime contribution ranges</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b0820" />
      <stop offset="1" stop-color="#140d2c" />
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" rx="18" fill="url(#bg)" stroke="#312e81" stroke-width="1.5" />
  <text x="${PAD}" y="40" fill="#ffffff" font-size="22" font-weight="900" font-style="italic" letter-spacing="1">THE 10 FORMS</text>
  <text x="${WIDTH - PAD}" y="40" fill="#c4b5fd" font-size="13" text-anchor="end">Lifetime contributions unlock each form · progress never goes down</text>
  ${cells}
</svg>
`;

const out = path.resolve('docs/forms.svg');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, svg);
console.log(`Wrote ${out} (${(svg.length / 1024).toFixed(1)} KB)`);
