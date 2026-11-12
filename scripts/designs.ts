/**
 * Design study: five alternative card layouts around the same Goku art and
 * the same card data. Every design is a plain 500x300 SVG that follows the
 * GitHub <img> rules (no external fonts, no scripts, SMIL/CSS animation
 * only), so any of them can replace the current card.
 *
 * Usage: npm run designs  ->  preview/designs.html
 */
import fs from 'node:fs';
import path from 'node:path';
import { generateMockStats } from '../src/api/github.js';
import type { ContributionStats } from '../src/api/types.js';
import { buildCardModel, type CardModel } from '../src/engine/card.js';
import { getDragonBallStarLayout } from '../src/assets/sprites.js';
import { CANVAS_HEIGHT, CANVAS_WIDTH, FRAME_COUNT, FRAME_DELAY_MS, renderCharacterFrames } from '../src/art/index.js';
import { encodePng } from '../src/art/png.js';
import { renderSvg } from '../src/renderer/svg.js';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const SANS = "'Segoe UI', system-ui, -apple-system, Helvetica, Arial, sans-serif";

const esc = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (value: number) => value.toLocaleString('en-US');
const pct = (card: CardModel) => Math.max(0, Math.min(100, card.progressPercent)) / 100;

/** Animated character frames, cropped to the figure and scaled to fit a box. */
function character(card: CardModel, x: number, y: number, w: number, h: number, crop = [22, 2, 84, 112]): string {
  const frames = renderCharacterFrames(card.currentForm, card.aura, card.stage);
  const duration = ((FRAME_COUNT * FRAME_DELAY_MS) / 1000).toFixed(2);
  const keyTimes = frames.map((_, index) => (index / FRAME_COUNT).toFixed(4)).join(';');
  const images = frames
    .map((frame, index) => {
      const values = frames.map((__, step) => (step === index ? '1' : '0')).join(';');
      return `<image width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" style="image-rendering:pixelated" opacity="${index === 0 ? 1 : 0}" href="data:image/png;base64,${encodePng(frame, 2).toString('base64')}"><animate attributeName="opacity" values="${values}" keyTimes="${keyTimes}" dur="${duration}s" calcMode="discrete" repeatCount="indefinite" /></image>`;
    })
    .join('');
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${crop.join(' ')}" preserveAspectRatio="xMidYMax meet">${images}</svg>`;
}

const BALL_GRADIENT = `<radialGradient id="db" cx="38%" cy="32%" r="70%"><stop offset="0%" stop-color="#fff7cc"/><stop offset="35%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#b45309"/></radialGradient>`;

/** Vector Dragon Ball: glossy orange with red stars, or a dim empty slot. */
function ball(cx: number, cy: number, r: number, star: number, lit: boolean, dim = '#1f2937'): string {
  if (!lit) return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${dim}" stroke="#ffffff" stroke-opacity="0.08" />`;
  const stars = getDragonBallStarLayout(star)
    .map(([sx, sy]) => `<circle cx="${(cx + ((sx - 6) / 6) * r * 0.95).toFixed(1)}" cy="${(cy + ((sy - 6) / 6) * r * 0.95).toFixed(1)}" r="${Math.max(0.9, r * 0.16).toFixed(1)}" fill="#dc2626" />`)
    .join('');
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#db)" stroke="#78350f" stroke-width="0.8" />${stars}`;
}

function balls(card: CardModel, x: number, y: number, r: number, gap: number, dim?: string): string {
  return Array.from({ length: 7 }, (_, index) => ball(x + index * gap, y, r, index + 1, index < card.unlockedBalls, dim)).join('');
}

/** Small flame icon. */
const flame = (x: number, y: number, s: number, color: string) =>
  `<path transform="translate(${x},${y}) scale(${s})" d="M6 0 C7 4 11 5 11 10 C11 14 8 16 6 16 C3 16 1 14 1 10 C1 7 3 6 4 3 C5 5 5 6 6 7 C6 5 6 3 6 0 Z" fill="${color}" />`;

function dayBars(stats: ContributionStats, x: number, y: number, w: number, h: number, on: string, off: string, rx = 1): string {
  const gap = 2;
  const barW = (w - gap * 13) / 14;
  return stats.recentDays
    .map((day, index) => {
      const level = Math.min(day.count, 6) / 6;
      const barH = day.count > 0 ? Math.max(3, h * (0.3 + 0.7 * level)) : 3;
      return `<rect x="${(x + index * (barW + gap)).toFixed(1)}" y="${(y + h - barH).toFixed(1)}" width="${barW.toFixed(1)}" height="${barH.toFixed(1)}" rx="${rx}" fill="${day.count > 0 ? on : off}" />`;
    })
    .join('');
}

function stagePips(card: CardModel, x: number, y: number, size: number, on: string, off: string, gap = 3): string {
  return [0, 1, 2]
    .map((index) => `<rect x="${x + index * (size + gap)}" y="${y}" width="${size}" height="${size}" rx="1" fill="${index <= card.stage ? on : off}" />`)
    .join('');
}

const nextText = (card: CardModel) =>
  card.nextForm ? `${card.nextForm.name} ${card.eta?.long ?? ''}` : 'FINAL FORM REACHED';

// ---------------------------------------------------------------------------
// 1. SCOUTER: green Dragon Ball scouter readout with a scanning reticle.
// ---------------------------------------------------------------------------
function scouter(stats: ContributionStats, card: CardModel): string {
  const g = '#4ade80';
  const barW = 262;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300" viewBox="0 0 500 300" font-family="${MONO}">
  <defs>
    ${BALL_GRADIENT}
    <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#03140c"/><stop offset="1" stop-color="#010604"/></linearGradient>
    <pattern id="scan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="${g}" opacity="0.06"/></pattern>
    <filter id="glow1"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect x="1" y="1" width="498" height="298" rx="14" fill="url(#bg1)" stroke="#14532d" stroke-width="1.5"/>
  <g opacity="0.5" stroke="${g}" stroke-width="2" fill="none">
    <path d="M28 52 V40 H40"/><path d="M180 40 H192 V52"/><path d="M28 258 V270 H40"/><path d="M180 270 H192 V258"/>
  </g>
  <circle cx="110" cy="165" r="78" fill="none" stroke="${g}" stroke-opacity="0.3" stroke-dasharray="4 9">
    <animateTransform attributeName="transform" type="rotate" from="0 110 165" to="360 110 165" dur="14s" repeatCount="indefinite"/>
  </circle>
  <line x1="32" x2="188" y1="165" y2="165" stroke="${g}" stroke-opacity="0.18"/>
  ${character(card, 36, 44, 148, 222)}
  <rect x="0" y="0" width="500" height="300" fill="url(#scan)"/>
  <rect x="34" y="60" width="152" height="2" fill="${g}" opacity="0.35">
    <animate attributeName="y" values="50;260;50" dur="3.2s" repeatCount="indefinite"/>
  </rect>

  <text x="212" y="30" fill="${g}" font-size="9" letter-spacing="2">SCOUTER // @${esc(stats.username)}</text>
  <circle cx="474" cy="27" r="3" fill="#ef4444"><animate attributeName="opacity" values="1;0.2;1" dur="1.1s" repeatCount="indefinite"/></circle>
  <text x="466" y="30" fill="#fca5a5" font-size="8" text-anchor="end">LIVE</text>

  <path d="M212 40 H470 Q482 40 482 52 V104 Q482 116 470 116 H224 Q212 116 212 104 Z" fill="${g}" fill-opacity="0.07" stroke="${g}" stroke-opacity="0.45"/>
  <text x="226" y="58" fill="#86efac" font-size="9" letter-spacing="2">POWER LEVEL</text>
  <text x="226" y="98" fill="#dcfce7" font-size="34" font-weight="800" filter="url(#glow1)">${num(stats.powerLevel)}
    <animate attributeName="opacity" values="1;0.82;1;1;1" dur="2.4s" repeatCount="indefinite"/>
  </text>
  ${stats.powerLevel > 9000 ? `<text x="470" y="58" fill="#facc15" font-size="8" text-anchor="end" font-weight="700">IT'S OVER 9,000</text>` : ''}

  <text x="212" y="140" fill="#f0fdf4" font-size="16" font-weight="800" letter-spacing="1">${esc(card.currentForm.name)}</text>
  ${stagePips(card, 440, 130, 8, g, '#14532d')}
  <text x="212" y="153" fill="#86efac" font-size="8">${esc(card.currentForm.title)}</text>
  <rect x="212" y="160" width="${barW}" height="7" fill="#052e16" stroke="${g}" stroke-opacity="0.4"/>
  <rect x="212" y="160" width="${(barW * pct(card)).toFixed(1)}" height="7" fill="${g}"/>
  <rect x="${212 + barW / 3}" y="159" width="1" height="9" fill="#010604"/><rect x="${212 + (2 * barW) / 3}" y="159" width="1" height="9" fill="#010604"/>
  <text x="212" y="180" fill="#86efac" font-size="8">NEXT ▸ ${esc(nextText(card))}</text>

  <text x="212" y="206" fill="#86efac" font-size="8" letter-spacing="2">KI STREAK</text>
  <text x="212" y="228" fill="#dcfce7" font-size="20" font-weight="800">${card.streak.current}${card.streak.unit}</text>
  <text x="270" y="228" fill="#4d7c5f" font-size="9">BEST ${card.streak.best}${card.streak.unit}</text>
  ${dayBars(stats, 340, 200, 134, 28, g, '#0b3b22', 0)}

  <text x="212" y="254" fill="#86efac" font-size="8" letter-spacing="2">DRAGON BALLS ${card.unlockedBalls}/7 · THIS YEAR</text>
  ${balls(card, 222, 272, 8, 22, '#0b2a1a')}
</svg>`;
}

// ---------------------------------------------------------------------------
// 2. TOURNAMENT: fighting-game HUD; the streak is the round timer.
// ---------------------------------------------------------------------------
function tournament(stats: ContributionStats, card: CardModel): string {
  const aura = card.currentForm.auraColors.primary;
  const hpW = 190;
  const floorLines = Array.from({ length: 9 }, (_, i) => {
    const x = -200 + i * 112;
    return `<line x1="250" y1="236" x2="${x}" y2="300" stroke="${aura}" stroke-opacity="0.18"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300" viewBox="0 0 500 300" font-family="${SANS}">
  <defs>
    ${BALL_GRADIENT}
    <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0820"/><stop offset="0.75" stop-color="#1a1035"/><stop offset="1" stop-color="#0b0820"/></linearGradient>
    <radialGradient id="spot2" cx="50%" cy="80%" r="55%"><stop offset="0" stop-color="${aura}" stop-opacity="0.35"/><stop offset="1" stop-color="${aura}" stop-opacity="0"/></radialGradient>
    <linearGradient id="hp2" x1="0" x2="1"><stop offset="0" stop-color="#fde047"/><stop offset="1" stop-color="${aura}"/></linearGradient>
  </defs>
  <rect x="1" y="1" width="498" height="298" rx="14" fill="url(#sky2)" stroke="#312e81" stroke-width="1.5"/>
  <ellipse cx="250" cy="250" rx="260" ry="120" fill="url(#spot2)"/>
  <path d="M0 236 H500 V300 H0 Z" fill="#120c26"/>
  ${floorLines}
  <line x1="0" y1="236" x2="500" y2="236" stroke="${aura}" stroke-opacity="0.45"/>
  <ellipse cx="250" cy="262" rx="70" ry="9" fill="#000" opacity="0.45"/>

  ${character(card, 170, 58, 160, 210)}

  <polygon points="14,14 214,14 204,38 14,38" fill="#0f0a24" stroke="${aura}" stroke-width="1.5"/>
  <text x="24" y="31" fill="#ffffff" font-size="13" font-weight="900" font-style="italic" letter-spacing="1">${esc(card.currentForm.name)}</text>
  <polygon points="14,44 ${14 + hpW},44 ${6 + hpW},56 14,56" fill="#1f1640" stroke="#000" stroke-width="1"/>
  <polygon points="14,44 ${14 + hpW * pct(card)},44 ${6 + hpW * pct(card)},56 14,56" fill="url(#hp2)"/>
  <line x1="${14 + hpW / 3}" y1="44" x2="${10 + hpW / 3}" y2="56" stroke="#0b0820" stroke-width="1.5"/>
  <line x1="${14 + (2 * hpW) / 3}" y1="44" x2="${10 + (2 * hpW) / 3}" y2="56" stroke="#0b0820" stroke-width="1.5"/>
  <text x="14" y="70" fill="#c4b5fd" font-size="8" font-weight="700">NEXT ▸ ${esc(nextText(card))}</text>
  <text x="14" y="82" fill="#7c6fb0" font-size="8">@${esc(stats.username)} · ${esc(card.currentForm.saga)}</text>

  <rect x="226" y="10" width="48" height="40" rx="6" fill="#0f0a24" stroke="#fde047" stroke-width="1.5"/>
  <text x="250" y="39" fill="#fde047" font-size="24" font-weight="900" text-anchor="middle">${card.streak.current}</text>
  <text x="250" y="62" fill="#fde047" font-size="7" font-weight="800" text-anchor="middle" letter-spacing="1">${card.streak.noun.toUpperCase()} STREAK</text>
  <text x="250" y="72" fill="#7c6fb0" font-size="7" text-anchor="middle">BEST ${card.streak.best}${card.streak.unit}</text>

  <text x="486" y="24" fill="#c4b5fd" font-size="8" font-weight="800" text-anchor="end" letter-spacing="2">POWER</text>
  <text x="486" y="48" fill="#fde047" font-size="26" font-weight="900" font-style="italic" text-anchor="end" stroke="#3b0764" stroke-width="1" paint-order="stroke">${num(stats.powerLevel)}</text>
  ${balls(card, 352, 64, 7, 19, '#241a47')}
  <text x="486" y="84" fill="#7c6fb0" font-size="7" text-anchor="end">DRAGON BALLS ${card.unlockedBalls}/7 THIS YEAR</text>

  <text x="16" y="262" fill="#c4b5fd" font-size="8" font-weight="800" letter-spacing="1">KI · 14 DAYS</text>
  ${dayBars(stats, 16, 268, 120, 18, '#fde047', '#2a2050', 1)}
  <text x="484" y="262" fill="#c4b5fd" font-size="8" font-weight="800" text-anchor="end" letter-spacing="1">STAGE</text>
  ${stagePips(card, 446, 268, 10, aura, '#2a2050')}
</svg>`;
}

// ---------------------------------------------------------------------------
// 3. GLASS: modern dashboard, blurred aura light, progress ring.
// ---------------------------------------------------------------------------
function glass(stats: ContributionStats, card: CardModel): string {
  const { primary, secondary } = card.currentForm.auraColors;
  const ringR = 24;
  const ringC = 2 * Math.PI * ringR;
  const points = stats.recentDays.map((day, index) => [252 + index * 17, 270 - Math.min(day.count, 6) * 5] as const);
  const line = points.map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`).join(' ');
  const area = `${line} L${points[points.length - 1][0]} 272 L${points[0][0]} 272 Z`;
  const chip = (x: number, y: number, w: number, h: number) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-opacity="0.1"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300" viewBox="0 0 500 300" font-family="${SANS}">
  <defs>
    ${BALL_GRADIENT}
    <filter id="blur3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="38"/></filter>
    <linearGradient id="spark3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${primary}" stop-opacity="0.55"/><stop offset="1" stop-color="${primary}" stop-opacity="0"/></linearGradient>
    <linearGradient id="edge3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${primary}"/><stop offset="1" stop-color="${secondary}"/></linearGradient>
    <clipPath id="clip3"><rect x="1" y="1" width="498" height="298" rx="18"/></clipPath>
  </defs>
  <g clip-path="url(#clip3)">
    <rect width="500" height="300" fill="#0a0f1e"/>
    <circle cx="110" cy="190" r="110" fill="${primary}" opacity="0.45" filter="url(#blur3)"/>
    <circle cx="420" cy="40" r="90" fill="${secondary}" opacity="0.35" filter="url(#blur3)"/>
  </g>
  <rect x="1" y="1" width="498" height="298" rx="18" fill="none" stroke="url(#edge3)" stroke-opacity="0.6" stroke-width="1.5"/>

  ${chip(14, 14, 214, 272)}
  ${character(card, 24, 22, 194, 220)}
  <text x="121" y="262" fill="#ffffff" font-size="15" font-weight="800" text-anchor="middle" letter-spacing="0.5">${esc(card.currentForm.name)}</text>
  <rect x="86" y="268" width="70" height="13" rx="6.5" fill="${primary}" fill-opacity="0.18" stroke="${primary}" stroke-opacity="0.5"/>
  <text x="121" y="278" fill="#ffffff" font-size="8" font-weight="700" text-anchor="middle">STAGE ${card.stage + 1} / 3</text>

  ${chip(238, 14, 120, 70)}
  <text x="252" y="34" fill="#94a3b8" font-size="9" font-weight="600">Power level</text>
  <text x="252" y="66" fill="#ffffff" font-size="24" font-weight="800">${num(stats.powerLevel)}</text>

  ${chip(366, 14, 120, 70)}
  <text x="380" y="34" fill="#94a3b8" font-size="9" font-weight="600">Streak</text>
  ${flame(380, 44, 1.2, '#fb7185')}
  <text x="400" y="64" fill="#ffffff" font-size="24" font-weight="800">${card.streak.current}<tspan font-size="12" fill="#94a3b8"> ${card.streak.noun}s</tspan></text>
  <text x="380" y="77" fill="#64748b" font-size="8">best ${card.streak.best}${card.streak.unit}</text>

  ${chip(238, 92, 120, 110)}
  <circle cx="298" cy="136" r="${ringR}" fill="none" stroke="#ffffff" stroke-opacity="0.1" stroke-width="6"/>
  <circle cx="298" cy="136" r="${ringR}" fill="none" stroke="url(#edge3)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(ringC * pct(card)).toFixed(1)} ${ringC.toFixed(1)}" transform="rotate(-90 298 136)"/>
  ${[1 / 3, 2 / 3].map((f) => { const a = f * 2 * Math.PI - Math.PI / 2; return `<circle cx="${(298 + Math.cos(a) * ringR).toFixed(1)}" cy="${(136 + Math.sin(a) * ringR).toFixed(1)}" r="2" fill="#0a0f1e"/>`; }).join('')}
  <text x="298" y="140" fill="#ffffff" font-size="12" font-weight="800" text-anchor="middle">${card.progressPercent}%</text>
  <text x="298" y="178" fill="#e2e8f0" font-size="8.5" font-weight="700" text-anchor="middle">${card.nextForm ? `Next: ${esc(card.nextForm.name.toLowerCase())}` : 'Final form'}</text>
  <text x="298" y="191" fill="#94a3b8" font-size="8" text-anchor="middle">${card.nextForm ? `+${num(card.contributionsToNext)} · ${esc(card.eta?.long ?? '')}` : 'all stages complete'}</text>

  ${chip(366, 92, 120, 110)}
  <text x="380" y="112" fill="#94a3b8" font-size="9" font-weight="600">Dragon Balls</text>
  ${Array.from({ length: 7 }, (_, i) => { const a = Math.PI + (i / 6) * Math.PI; return ball(426 + Math.cos(a) * 34, 160 + Math.sin(a) * 30, 7, i + 1, i < card.unlockedBalls, '#1e293b'); }).join('')}
  <text x="426" y="170" fill="#ffffff" font-size="16" font-weight="800" text-anchor="middle">${card.unlockedBalls}/7</text>
  <text x="426" y="190" fill="#94a3b8" font-size="8" text-anchor="middle">${card.nextBall ? `next at ${card.nextBall.at} this year` : 'Shenron summoned'}</text>

  ${chip(238, 210, 248, 76)}
  <text x="252" y="229" fill="#94a3b8" font-size="9" font-weight="600">Last 14 days</text>
  <text x="472" y="229" fill="#64748b" font-size="8" text-anchor="end">@${esc(stats.username)}</text>
  <path d="${area}" fill="url(#spark3)"/>
  <path d="${line}" fill="none" stroke="${primary}" stroke-width="1.8" stroke-linejoin="round"/>
  ${points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#ffffff"/>`).join('')}
</svg>`;
}

// ---------------------------------------------------------------------------
// 4. RPG STATUS: SNES-style status and message windows.
// ---------------------------------------------------------------------------
function rpg(stats: ContributionStats, card: CardModel): string {
  const windowBox = (x: number, y: number, w: number, h: number) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="url(#win4)" stroke="#f8fafc" stroke-width="2.5"/>
    <rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="4" fill="none" stroke="#93c5fd" stroke-opacity="0.6"/>`;
  const level = card.currentForm ? (['kid', 'base', 'kaioken', 'ssj1', 'ssj2', 'ssj3', 'ssj4', 'ssjg', 'ssjb', 'mui'].indexOf(card.currentForm.id) + 1) : 1;
  const message =
    card.aura.intensity === 'hyper'
      ? 'Goku’s ki is exploding! Keep the streak alive!'
      : card.aura.intensity === 'super'
        ? 'Goku is powering up. The aura is blazing.'
        : card.aura.intensity === 'flaring'
          ? 'Goku’s ki is rising. Train a few more days!'
          : 'Goku is resting. Push code to wake his ki.';
  const expW = 120;
  const rows: [string, string, string?][] = [
    ['PL', num(stats.powerLevel)],
    ['STREAK', `${card.streak.current}${card.streak.unit}  (best ${card.streak.best})`],
    ['NEXT', card.nextForm ? `${card.nextForm.name}` : 'MAX'],
    ['ETA', card.nextForm ? (card.eta?.long ?? '') : '—'],
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300" viewBox="0 0 500 300" font-family="${MONO}">
  <defs>
    ${BALL_GRADIENT}
    <linearGradient id="win4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2346b0"/><stop offset="1" stop-color="#0c1a4f"/></linearGradient>
  </defs>
  <rect x="1" y="1" width="498" height="298" rx="14" fill="#05070f"/>
  ${windowBox(10, 10, 184, 280)}
  ${character(card, 18, 18, 168, 238)}
  <text x="102" y="276" fill="#fef08a" font-size="10" font-weight="700" text-anchor="middle">${esc(card.currentForm.name)}</text>

  ${windowBox(202, 10, 288, 194)}
  <text x="218" y="34" fill="#f8fafc" font-size="11" font-weight="700">@${esc(stats.username)}</text>
  <text x="474" y="34" fill="#fef08a" font-size="11" font-weight="700" text-anchor="end">LV ${level}</text>
  <text x="218" y="52" fill="#93c5fd" font-size="9">${esc(card.currentForm.title)}</text>
  ${rows.map(([label, value], i) => `<text x="218" y="${76 + i * 18}" fill="#93c5fd" font-size="10" font-weight="700">${label}</text><text x="290" y="${76 + i * 18}" fill="#f8fafc" font-size="10">${esc(value)}</text>`).join('')}
  <text x="218" y="${76 + 4 * 18}" fill="#93c5fd" font-size="10" font-weight="700">EXP</text>
  <rect x="290" y="${68 + 4 * 18}" width="${expW}" height="8" fill="#0b1235" stroke="#f8fafc" stroke-width="1"/>
  <rect x="291" y="${69 + 4 * 18}" width="${((expW - 2) * pct(card)).toFixed(1)}" height="6" fill="#facc15"/>
  <rect x="${290 + expW / 3}" y="${68 + 4 * 18}" width="1" height="8" fill="#0b1235"/><rect x="${290 + (2 * expW) / 3}" y="${68 + 4 * 18}" width="1" height="8" fill="#0b1235"/>
  ${stagePips(card, 418, 69 + 4 * 18, 7, '#facc15', '#0b1235', 3)}
  <text x="218" y="${76 + 5 * 18 + 4}" fill="#93c5fd" font-size="10" font-weight="700">BALLS</text>
  ${balls(card, 296, 72 + 5 * 18, 6, 16, '#0b1235')}
  <text x="474" y="${76 + 5 * 18 + 4}" fill="#f8fafc" font-size="9" text-anchor="end">${card.unlockedBalls}/7</text>

  ${windowBox(202, 212, 288, 78)}
  <text x="218" y="238" fill="#f8fafc" font-size="10">${esc(message)}</text>
  <text x="218" y="256" fill="#93c5fd" font-size="8">KI 14D</text>
  ${dayBars(stats, 258, 246, 150, 14, '#facc15', '#1e2b66', 0)}
  <polygon points="466,268 476,268 471,275" fill="#f8fafc"><animate attributeName="opacity" values="1;0;1" dur="1s" calcMode="discrete" repeatCount="indefinite"/></polygon>
</svg>`;
}

// ---------------------------------------------------------------------------
// 5. DRAGON RADAR: the yearly ball hunt on a sweeping radar.
// ---------------------------------------------------------------------------
function radar(stats: ContributionStats, card: CardModel): string {
  const cx = 392;
  const cy = 162;
  const r = 92;
  const blips = Array.from({ length: 7 }, (_, i) => {
    const angle = (i / 7) * Math.PI * 2 + 0.6;
    const dist = r * (0.35 + 0.55 * ((i * 37) % 10) / 10);
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    const lit = i < card.unlockedBalls;
    return lit
      ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="#fbbf24" opacity="0.25"><animate attributeName="r" values="6;12;6" dur="1.6s" begin="${(i * 0.23).toFixed(2)}s" repeatCount="indefinite"/></circle>${ball(+x.toFixed(1), +y.toFixed(1), 5, i + 1, true)}`
      : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#134e4a"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300" viewBox="0 0 500 300" font-family="${MONO}">
  <defs>
    ${BALL_GRADIENT}
    <linearGradient id="bg5" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#06121a"/><stop offset="1" stop-color="#020a0e"/></linearGradient>
    <radialGradient id="screen5" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#14532d"/><stop offset="1" stop-color="#052e1b"/></radialGradient>
    <linearGradient id="sweep5" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#86efac" stop-opacity="0"/><stop offset="1" stop-color="#86efac" stop-opacity="0.45"/></linearGradient>
    <clipPath id="disc5"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
  </defs>
  <rect x="1" y="1" width="498" height="298" rx="14" fill="url(#bg5)" stroke="#164e63" stroke-width="1.5"/>

  <text x="20" y="32" fill="#e2e8f0" font-size="15" font-weight="800" letter-spacing="1">${esc(card.currentForm.name)}</text>
  <text x="20" y="46" fill="#5eead4" font-size="8">@${esc(stats.username)} · ${esc(card.currentForm.saga)}</text>
  ${character(card, 14, 52, 156, 238)}

  <text x="180" y="78" fill="#5eead4" font-size="8" letter-spacing="2">POWER</text>
  <text x="180" y="98" fill="#f0fdfa" font-size="17" font-weight="800">${num(stats.powerLevel)}</text>
  <text x="180" y="124" fill="#5eead4" font-size="8" letter-spacing="2">STREAK</text>
  ${flame(180, 130, 1, '#fb7185')}
  <text x="196" y="144" fill="#f0fdfa" font-size="17" font-weight="800">${card.streak.current}${card.streak.unit}</text>
  <text x="180" y="157" fill="#64748b" font-size="8">best ${card.streak.best}${card.streak.unit}</text>
  <text x="180" y="182" fill="#5eead4" font-size="8" letter-spacing="2">NEXT FORM</text>
  <rect x="180" y="188" width="104" height="6" rx="3" fill="#0f2a33"/>
  <rect x="180" y="188" width="${(104 * pct(card)).toFixed(1)}" height="6" rx="3" fill="#2dd4bf"/>
  ${stagePips(card, 180, 199, 6, '#2dd4bf', '#0f2a33')}
  <text x="180" y="218" fill="#cbd5e1" font-size="8">${card.nextForm ? esc(card.nextForm.name.toLowerCase()) : 'final form'}</text>
  <text x="180" y="229" fill="#64748b" font-size="8">${card.nextForm ? esc(card.eta?.long ?? '') : ''}</text>
  ${dayBars(stats, 180, 244, 104, 22, '#2dd4bf', '#0f2a33', 1)}
  <text x="180" y="278" fill="#64748b" font-size="7">KI · 14 DAYS</text>

  <circle cx="${cx}" cy="${cy}" r="${r + 8}" fill="#0b1f1a" stroke="#475569" stroke-width="3"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#screen5)"/>
  <g stroke="#4ade80" stroke-opacity="0.25" fill="none">
    <circle cx="${cx}" cy="${cy}" r="${r / 3}"/><circle cx="${cx}" cy="${cy}" r="${(2 * r) / 3}"/>
    <line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}"/><line x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy + r}"/>
  </g>
  <g clip-path="url(#disc5)">
    <path d="M${cx} ${cy} L${cx + r} ${cy} A${r} ${r} 0 0 0 ${(cx + r * Math.cos(-0.7)).toFixed(1)} ${(cy + r * Math.sin(-0.7)).toFixed(1)} Z" fill="url(#sweep5)">
      <animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="4s" repeatCount="indefinite"/>
    </path>
  </g>
  ${blips}
  <polygon points="${cx},${cy - 5} ${cx + 4},${cy + 4} ${cx - 4},${cy + 4}" fill="#f87171"/>
  <text x="${cx}" y="${cy + r + 26}" fill="#5eead4" font-size="9" text-anchor="middle" letter-spacing="2">DRAGON RADAR · ${card.unlockedBalls}/7</text>
  <text x="${cx}" y="${cy - r - 14}" fill="#64748b" font-size="8" text-anchor="middle">${card.nextBall ? `next ball ${card.nextBall.star}★ at ${card.nextBall.at} this year` : 'all 7 found · Shenron summoned'}</text>
</svg>`;
}

// ---------------------------------------------------------------------------
const designs: { id: string; name: string; pitch: string; render: (s: ContributionStats, c: CardModel) => string }[] = [
  { id: 'classic', name: 'Current card (Tournament + orbit)', pitch: 'What ships now: the Tournament HUD with Dragon Balls orbiting Goku.', render: (stats) => renderSvg(stats) },
  { id: 'scouter', name: '1 · Scouter', pitch: 'A green Dragon Ball scouter readout: rotating target reticle, scan line, big glowing power level, "IT\'S OVER 9,000" over 9,000.', render: scouter },
  { id: 'tournament', name: '2 · Tournament', pitch: 'Fighting-game HUD: form name plate, the progress bar as a health bar, the streak as the round timer, power level as the score, arena floor.', render: tournament },
  { id: 'glass', name: '3 · Glass', pitch: 'Modern dashboard: glass panels lit by the aura colours, a progress ring with stage notches, Dragon Balls in an arc, 14-day sparkline.', render: glass },
  { id: 'rpg', name: '4 · RPG Status', pitch: 'SNES-style status window: LV, PL, EXP bar, ball slots, and a message box that reacts to your streak.', render: rpg },
  { id: 'radar', name: '5 · Dragon Radar', pitch: 'The yearly ball hunt on a sweeping radar: found balls pulse as blips. Stats in a compact column.', render: radar },
];

const samples: { label: string; stats: ContributionStats }[] = [
  { label: 'Super Saiyan 3 · 21-day streak', stats: generateMockStats('octocat', { form: 'ssj3', streak: 21 }) },
  { label: 'Kaio-ken · 2-day streak (like your account)', stats: generateMockStats('jaeef', { commits: 230, streak: 2 }) },
];

const outDir = path.resolve('preview');
fs.mkdirSync(outDir, { recursive: true });
const sections = designs.map((design) => {
  const cards = samples
    .map(({ label, stats }) => {
      const svg = design.render(stats, buildCardModel(stats));
      fs.writeFileSync(path.join(outDir, `design-${design.id}-${stats.username}.svg`), svg);
      return `<figure><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" width="500" height="300" alt="${esc(design.name)}"/><figcaption>${esc(label)} · ${(svg.length / 1024).toFixed(0)} KB</figcaption></figure>`;
    })
    .join('');
  return `<section><h2>${esc(design.name)}</h2><p>${esc(design.pitch)}</p><div class="grid">${cards}</div></section>`;
});

fs.writeFileSync(
  path.join(outDir, 'designs.html'),
  `<!doctype html><meta charset="utf-8"><title>git-saiyan card designs</title>
<style>
  body { background:#0d1117; color:#c9d1d9; font:14px system-ui, sans-serif; margin:28px; }
  h1 { margin:0 0 6px; } h2 { margin:0 0 4px; color:#f0f6fc; } p { margin:0 0 12px; color:#8b949e; max-width:900px; }
  section { margin:0 0 36px; padding-bottom:28px; border-bottom:1px solid #21262d; }
  .grid { display:flex; flex-wrap:wrap; gap:20px; }
  figure { margin:0; } figcaption { text-align:center; color:#8b949e; margin-top:6px; }
</style>
<h1>git-saiyan · card design options</h1>
<p>Same Goku art and data in every design. Each card is a GitHub-safe 500×300 SVG (no external fonts or scripts), animated.</p>
${sections.join('\n')}`
);
console.log(`Written to ${path.join(outDir, 'designs.html')}`);
