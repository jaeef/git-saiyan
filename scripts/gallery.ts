/**
 * Dev helper: render every Goku form and write a self-contained
 * preview/index.html (cards are embedded, so the page opens anywhere).
 * Usage: npm run gallery
 */
import fs from 'node:fs';
import path from 'node:path';
import { generateMockStats } from '../src/api/github.js';
import { GOKU_FORMS } from '../src/engine/forms.js';
import { renderSvg } from '../src/renderer/svg.js';

const outDir = path.resolve('preview');
fs.mkdirSync(outDir, { recursive: true });

const sections: string[] = [];
for (const [label, streak] of [
  ['Full aura · 21-day streak', 21],
  ['Calm · 2-day streak', 2],
] as const) {
  const cards = GOKU_FORMS.map((form) => {
    const svg = renderSvg(generateMockStats('octocat', { form: form.id, streak }));
    fs.writeFileSync(path.join(outDir, `goku-${form.id}-streak${streak}.svg`), svg);
    const uri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    return `<figure><img src="${uri}" width="500" height="300" alt="${form.name}" /><figcaption>${form.name}</figcaption></figure>`;
  });
  sections.push(`<h2>${label}</h2><div class="grid">${cards.join('')}</div>`);
}

fs.writeFileSync(
  path.join(outDir, 'index.html'),
  `<!doctype html><meta charset="utf-8"><title>git-saiyan gallery</title>
<style>
  body { background:#0d1117; color:#c9d1d9; font:14px system-ui, sans-serif; margin:24px; }
  h2 { margin:32px 0 12px; }
  .grid { display:flex; flex-wrap:wrap; gap:16px; }
  figure { margin:0; } figcaption { text-align:center; color:#8b949e; margin-top:4px; }
</style>
<h1>git-saiyan card gallery</h1>
<p>Demo data. Cards are animated.</p>
${sections.join('\n')}`
);
console.log(`Gallery written to ${path.join(outDir, 'index.html')}`);
