import type { ContributionStats } from '../api/types.js';
import type { DragonBall } from '../engine/dragonballs.js';
import { buildCardModel } from '../engine/card.js';
import {
  getDragonBallBaseSprite,
  getDragonBallStarLayout,
  type PixelSprite,
} from '../assets/sprites.js';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DISPLAY_SCALE,
  FEET_Y,
  FRAME_COUNT,
  FRAME_DELAY_MS,
  renderCharacterFrames,
} from '../art/index.js';
import { encodePng } from '../art/png.js';

const CARD_WIDTH = 500;
const CARD_HEIGHT = 300;
const ORBIT = { centerX: 250, centerY: 172, radiusX: 168, radiusY: 42 };
/** Card row where the character's feet land (on the arena floor). */
const GROUND_Y = 266;
/** Horizon line of the arena floor. */
const HORIZON_Y = 236;
/** Dragon Balls are drawn a little larger than their 12px sprite. */
const BALL_SCALE = 1.3;
const FONT = "'Segoe UI', system-ui, -apple-system, Helvetica, Arial, sans-serif";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return value.toLocaleString('en-US');
}

function spriteToSvg(sprite: PixelSprite, startX: number, startY: number, scale: number): string {
  const frame = sprite.frames[0];
  let rects = '';

  for (let row = 0; row < frame.length; row++) {
    const line = frame[row];
    let runColor: string | null = null;
    let runStart = 0;

    for (let col = 0; col <= line.length; col++) {
      const color = col < line.length ? sprite.palette[line[col]] ?? 'transparent' : null;
      if (color === runColor) continue;

      if (runColor && runColor !== 'transparent') {
        const width = (col - runStart) * scale;
        rects += `<rect x="${startX + runStart * scale}" y="${startY + row * scale}" width="${width}" height="${scale}" fill="${runColor}" />`;
      }

      runColor = color;
      runStart = col;
    }
  }

  return rects;
}

function renderDragonBall(ball: DragonBall, index: number): string {
  const base = getDragonBallBaseSprite();
  const stars = getDragonBallStarLayout(ball.star);
  const keyframes = 24;
  const duration = 16;
  const translateValues: string[] = [];
  const scaleValues: string[] = [];
  const opacityValues: string[] = [];

  for (let keyframe = 0; keyframe <= keyframes; keyframe++) {
    const progress = keyframe / keyframes;
    const angle = (index / 7) * Math.PI * 2 + progress * Math.PI * 2;
    const x = ORBIT.centerX + ORBIT.radiusX * Math.cos(angle);
    const y = ORBIT.centerY + ORBIT.radiusY * Math.sin(angle);
    const depth = (Math.sin(angle) + 1) / 2;

    translateValues.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    scaleValues.push(((0.85 + 0.3 * depth) * BALL_SCALE).toFixed(2));
    opacityValues.push((ball.isUnlocked ? 0.75 + 0.25 * depth : 0.12).toFixed(2));
  }

  const [startX, startY] = translateValues[0].split(',');
  const starShapes = stars
    .map(([sx, sy]) => {
      const radius = ball.star === 1 ? 1.55 : 1.15;
      return `<circle cx="${(sx - 5.5).toFixed(1)}" cy="${(sy - 6.5).toFixed(1)}" r="${radius}" fill="#dc2626" />`;
    })
    .join('');

  return `<g class="db-orb" data-star="${ball.star}" transform="translate(${startX},${startY})">
    <animateTransform attributeName="transform" type="translate" values="${translateValues.join(';')}" dur="${duration}s" repeatCount="indefinite" calcMode="linear" />
    <g transform="scale(${scaleValues[0]})">
      <animateTransform attributeName="transform" type="scale" values="${scaleValues.join(';')}" dur="${duration}s" repeatCount="indefinite" calcMode="linear" />
      <g opacity="${opacityValues[0]}">
        <animate attributeName="opacity" values="${opacityValues.join(';')}" dur="${duration}s" repeatCount="indefinite" calcMode="linear" />
        ${spriteToSvg(base, -base.width / 2, -base.height / 2, 1)}
        ${starShapes}
      </g>
    </g>
  </g>`;
}

export function renderSvg(stats: ContributionStats): string {
  const card = buildCardModel(stats, 0, ORBIT);
  const { currentForm, nextForm, progressPercent, contributionsToNext, aura, unlockedBalls, nextBall, stage, eta, streak } = card;
  const dragonBalls = card.dragonBalls;
  // Keep the original orbit index when splitting: it determines each ball's
  // base angle, not just paint order.
  const indexedBalls = dragonBalls.map((ball, index) => ({ ball, index }));
  const backBalls = indexedBalls.filter(({ ball }) => ball.z < 0);
  const frontBalls = indexedBalls.filter(({ ball }) => ball.z >= 0);

  const primaryAura = currentForm.auraColors.primary;

  // Character, aura, particles and lightning are pre-rendered pixel frames,
  // embedded as tiny PNGs and flipped with discrete SMIL opacity steps.
  const frames = renderCharacterFrames(currentForm, aura, stage);
  const spriteWidth = CANVAS_WIDTH * DISPLAY_SCALE;
  const spriteHeight = CANVAS_HEIGHT * DISPLAY_SCALE;
  const spriteX = 250 - spriteWidth / 2;
  const spriteY = GROUND_Y - FEET_Y * DISPLAY_SCALE;
  const duration = ((FRAME_COUNT * FRAME_DELAY_MS) / 1000).toFixed(2);
  const keyTimes = frames.map((_, index) => (index / FRAME_COUNT).toFixed(4)).join(';');
  const frameImage = (index: number, attributes: string) =>
    `<image x="0" y="0" width="${spriteWidth}" height="${spriteHeight}" preserveAspectRatio="none" style="image-rendering:pixelated" ${attributes} href="data:image/png;base64,${encodePng(frames[index], DISPLAY_SCALE).toString('base64')}" />`;
  const characterSvg = `<g transform="translate(${spriteX},${spriteY})">
    ${frames
      .map((_, index) => {
        const values = frames.map((__, step) => (step === index ? '1' : '0')).join(';');
        return frameImage(index, `class="ki-frame" opacity="${index === 0 ? 1 : 0}"`).replace(
          ' />',
          `><animate attributeName="opacity" values="${values}" keyTimes="${keyTimes}" dur="${duration}s" calcMode="discrete" repeatCount="indefinite" /></image>`
        );
      })
      .join('\n    ')}
    ${frameImage(0, 'class="ki-still"')}
  </g>`;

  const activityBlocks = stats.recentDays
    .map((day, index) => {
      const x = 16 + index * 9;
      const intensity = Math.min(day.count, 6);
      const height = 4 + intensity * 2;
      const y = 286 - height;
      const color = day.count > 0 ? (day.count > 3 ? '#fde047' : '#ca8a04') : '#2a2050';
      return `<rect class="ki-bar" x="${x}" y="${y}" width="8" height="${height}" rx="1" fill="${color}" />`;
    })
    .join('');

  // Health bar = progress to the next form, with notches at the stage points.
  const hpWidth = 190;
  const hpFill = Math.round((progressPercent / 100) * hpWidth);
  const hpNotches = [1 / 3, 2 / 3]
    .map((fraction) => {
      const x = 14 + Math.round(fraction * hpWidth);
      return `<line x1="${x}" y1="44" x2="${x - 4}" y2="56" stroke="#0b0820" stroke-width="1.5" />`;
    })
    .join('');
  const stagePips = [0, 1, 2]
    .map((index) => `<rect x="${446 + index * 13}" y="270" width="10" height="10" rx="2" fill="${index <= stage ? primaryAura : '#2a2050'}" />`)
    .join('');
  const nextLine = nextForm
    ? `NEXT ▸ ${nextForm.name} · +${contributionsToNext.toLocaleString('en-US')} · ${eta?.long ?? ''}`
    : 'FINAL FORM REACHED';
  const ballsLine = nextBall
    ? `NEXT BALL ${nextBall.star}★ AT ${formatCompact(nextBall.at)} THIS YEAR`
    : 'ALL 7 · SHENRON SUMMONED THIS YEAR';
  const floorLines = Array.from({ length: 9 }, (_, index) => {
    const x = -200 + index * 112;
    return `<line x1="250" y1="${HORIZON_Y}" x2="${x}" y2="300" stroke="${primaryAura}" stroke-opacity="0.18" />`;
  }).join('');
  const username = escapeXml(stats.username);
  const joined = stats.joinedYear ? ` · since ${stats.joinedYear}` : '';

  return `<svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="saiyan-title saiyan-desc" font-family="${FONT}">
  <title id="saiyan-title">${username}'s git-saiyan card</title>
  <desc id="saiyan-desc">${escapeXml(currentForm.name)} with ${unlockedBalls} of 7 Dragon Balls this year, a ${streak.current} ${streak.noun} streak, power-up stage ${stage + 1} of 3, and power level ${stats.powerLevel}.</desc>
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b0820" />
      <stop offset="0.75" stop-color="#1a1035" />
      <stop offset="1" stop-color="#0b0820" />
    </linearGradient>
    <radialGradient id="spotlight" cx="50%" cy="80%" r="55%">
      <stop offset="0" stop-color="${primaryAura}" stop-opacity="0.35" />
      <stop offset="1" stop-color="${primaryAura}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="hp" x1="0" x2="1">
      <stop offset="0" stop-color="#fde047" />
      <stop offset="1" stop-color="${primaryAura}" />
    </linearGradient>
    <clipPath id="card-clip"><rect x="1" y="1" width="${CARD_WIDTH - 2}" height="${CARD_HEIGHT - 2}" rx="14" /></clipPath>
    <style>
      .ki-still { display: none; }
      @media (prefers-reduced-motion: reduce) {
        .ki-frame { display: none; }
        .ki-still { display: inline; }
      }
    </style>
  </defs>

  <g clip-path="url(#card-clip)">
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#sky)" />
    <ellipse cx="250" cy="250" rx="260" ry="120" fill="url(#spotlight)" />
    <rect x="0" y="${HORIZON_Y}" width="${CARD_WIDTH}" height="${CARD_HEIGHT - HORIZON_Y}" fill="#120c26" />
    ${floorLines}
    <line x1="0" y1="${HORIZON_Y}" x2="${CARD_WIDTH}" y2="${HORIZON_Y}" stroke="${primaryAura}" stroke-opacity="0.45" />
    <ellipse cx="250" cy="${GROUND_Y - 2}" rx="62" ry="8" fill="#000000" opacity="0.45" />

    ${backBalls.map(({ ball, index }) => renderDragonBall(ball, index)).join('')}
    ${characterSvg}
    ${frontBalls.map(({ ball, index }) => renderDragonBall(ball, index)).join('')}
  </g>
  <rect x="1" y="1" width="${CARD_WIDTH - 2}" height="${CARD_HEIGHT - 2}" rx="14" fill="none" stroke="#312e81" stroke-width="1.5" />

  <polygon points="14,14 214,14 204,38 14,38" fill="#0f0a24" stroke="${primaryAura}" stroke-width="1.5" />
  <text x="24" y="31" fill="#ffffff" font-size="13" font-weight="900" font-style="italic" letter-spacing="1">${escapeXml(currentForm.name)}</text>
  <polygon points="14,44 ${14 + hpWidth},44 ${6 + hpWidth},56 14,56" fill="#1f1640" stroke="#000000" stroke-width="1" />
  ${hpFill > 0 ? `<polygon points="14,44 ${14 + hpFill},44 ${Math.max(14, 6 + hpFill)},56 14,56" fill="url(#hp)" />` : ''}
  ${hpNotches}
  <text x="14" y="70" fill="#c4b5fd" font-size="8" font-weight="700">${escapeXml(nextLine)}</text>
  <text x="14" y="82" fill="#7c6fb0" font-size="8">@${username}${joined} · ${escapeXml(currentForm.saga)}</text>

  <rect x="224" y="8" width="52" height="52" rx="7" fill="#0f0a24" stroke="#fde047" stroke-width="1.5" />
  <text x="250" y="36" fill="#fde047" font-size="24" font-weight="900" text-anchor="middle">${streak.current}</text>
  <text x="250" y="46" fill="#fde047" font-size="6" font-weight="800" text-anchor="middle" letter-spacing="0.5">${streak.noun.toUpperCase()} STREAK</text>
  <text x="250" y="55" fill="#a78bfa" font-size="6" text-anchor="middle">BEST ${streak.best}${streak.unit}</text>

  <text x="486" y="24" fill="#c4b5fd" font-size="8" font-weight="800" text-anchor="end" letter-spacing="2">POWER LEVEL</text>
  <text x="486" y="50" fill="#fde047" font-size="26" font-weight="900" font-style="italic" text-anchor="end" stroke="#3b0764" stroke-width="1" paint-order="stroke">${stats.powerLevel.toLocaleString('en-US')}</text>
  <text x="486" y="66" fill="#c4b5fd" font-size="8" font-weight="700" text-anchor="end">DRAGON BALLS ${unlockedBalls}/7</text>
  <text x="486" y="78" fill="#7c6fb0" font-size="7" text-anchor="end">${escapeXml(ballsLine)}</text>

  <text x="16" y="262" fill="#c4b5fd" font-size="8" font-weight="800" letter-spacing="1">KI · 14 DAYS</text>
  ${activityBlocks}
  <text x="484" y="264" fill="#c4b5fd" font-size="8" font-weight="800" text-anchor="end" letter-spacing="1">STAGE ${stage + 1}/3</text>
  ${stagePips}
</svg>`;
}
