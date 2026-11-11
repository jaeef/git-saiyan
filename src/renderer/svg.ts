import type { ContributionStats } from '../api/types.js';
import { calculateFormProgression, getSkin } from '../engine/forms.js';
import {
  calculateDragonBalls,
  calculateUnlockedBalls,
  nextDragonBallMilestone,
  type DragonBall,
} from '../engine/dragonballs.js';
import { calculateAuraFromStreak } from '../engine/streak.js';
import {
  getDragonBallBaseSprite,
  getDragonBallStarLayout,
  getSkinSprite,
  type PixelSprite,
} from '../assets/sprites.js';
import {
  generateLightningArcs,
  generateParticleTracks,
} from './particles.js';

const CARD_WIDTH = 500;
const CARD_HEIGHT = 280;
const ORBIT = { centerX: 250, centerY: 132, radiusX: 188, radiusY: 52 };

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
    scaleValues.push((0.85 + 0.3 * depth).toFixed(2));
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
  const skin = getSkin(stats.skinId || 'goku');
  const effectiveContributions = stats.peakContributions ?? stats.totalContributions;
  const { currentForm, nextForm, progressPercent, contributionsToNext } =
    calculateFormProgression(effectiveContributions, skin.id);
  const aura = calculateAuraFromStreak(stats.currentStreak, currentForm.hasSparks);
  const unlockedBalls = stats.unlockedBalls ?? calculateUnlockedBalls(effectiveContributions);
  const dragonBalls = calculateDragonBalls(unlockedBalls, 0, ORBIT);
  // Keep the original orbit index when splitting: it determines each ball's
  // base angle, not just paint order.
  const indexedBalls = dragonBalls.map((ball, index) => ({ ball, index }));
  const backBalls = indexedBalls.filter(({ ball }) => ball.z < 0);
  const frontBalls = indexedBalls.filter(({ ball }) => ball.z >= 0);
  const nextBall = nextDragonBallMilestone(effectiveContributions);
  const bestStreak = stats.bestStreak ?? stats.longestStreak;

  const skinSprite = getSkinSprite(skin.id, currentForm);
  const gokuScale = 4; // integer scale keeps pixel art crisp
  const gokuX = 250 - (skinSprite.width * gokuScale) / 2;
  const gokuY = 116 - (skinSprite.height * gokuScale) / 2;

  const primaryAura = currentForm.auraColors.primary;
  const coreAura = currentForm.auraColors.core;

  const particleTracks = generateParticleTracks(
    aura.particleCount,
    ORBIT.centerX,
    ORBIT.centerY,
    primaryAura,
    coreAura
  );
  const particlesSvg = particleTracks
    .map((track) => {
      const begin = track.delay > 0 ? `-${track.delay}s` : '0s';
      return `<circle cx="${track.x0}" cy="${track.y0}" r="${track.r0}" fill="${track.color}" opacity="0">
        <animate attributeName="cy" values="${track.y0};${track.y1}" dur="${track.duration}s" begin="${begin}" repeatCount="indefinite" calcMode="linear" />
        <animate attributeName="cx" values="${track.x0};${track.x1}" dur="${track.duration}s" begin="${begin}" repeatCount="indefinite" calcMode="linear" />
        <animate attributeName="r" values="${track.r0};${track.r1};0" dur="${track.duration}s" begin="${begin}" repeatCount="indefinite" calcMode="linear" />
        <animate attributeName="opacity" values="0;0.85;0" dur="${track.duration}s" begin="${begin}" repeatCount="indefinite" calcMode="linear" />
      </circle>`;
    })
    .join('');

  const lightning = generateLightningArcs(
    0.1,
    ORBIT.centerX,
    120,
    aura.sparkCount,
    currentForm.sparkColor || '#38bdf8'
  );
  const lightningSvg = lightning
    .map((arc, index) => {
      const points = arc.points.map((point) => `${point[0]},${point[1]}`).join(' ');
      return `<polyline points="${points}" fill="none" stroke="${arc.color}" stroke-width="${arc.width}" stroke-linecap="round" class="lightning" opacity="0.9">
        <animate attributeName="opacity" values="0.95;0.1;0.95" dur="0.45s" begin="-${(index * 0.11).toFixed(2)}s" repeatCount="indefinite" />
      </polyline>`;
    })
    .join('');

  const activityBlocks = stats.recentDays
    .map((day, index) => {
      const x = 316 + index * 11;
      const intensity = Math.min(day.count, 6);
      const height = 4 + intensity * 2;
      const y = 256 - height;
      const color = day.count > 0 ? (day.count > 3 ? '#22c55e' : '#15803d') : '#334155';
      return `<rect class="ki-bar" x="${x}" y="${y}" width="8" height="${height}" rx="1.5" fill="${color}" />`;
    })
    .join('');

  const progressWidth = Math.round((progressPercent / 100) * 120);
  const nextLabel = nextForm ? `NEXT: ${nextForm.name}` : 'MAX FORM';
  const relicWord = skin.relic.short.replace(/S$/, '');
  const ballsLabel = `${skin.relic.short} ${unlockedBalls}/7`;
  const relicLabel = nextBall
    ? `next ${relicWord.toLowerCase()} ${nextBall.star}★ at ${formatCompact(nextBall.at)}`
    : `all 7 ${skin.relic.plural.toLowerCase()} summoned`;
  const subtitle = `${currentForm.title} · ${relicLabel}`;
  const username = escapeXml(stats.username);
  const joined = stats.joinedYear ? ` · since ${stats.joinedYear}` : '';

  return `<svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="saiyan-title saiyan-desc">
  <title id="saiyan-title">${username}'s git-saiyan card</title>
  <desc id="saiyan-desc">${escapeXml(currentForm.name)} with ${unlockedBalls} of 7 ${escapeXml(skin.relic.plural)}, a ${stats.currentStreak} day streak, and power level ${stats.powerLevel}.</desc>
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="50%" stop-color="#0d1117" />
      <stop offset="100%" stop-color="#050811" />
    </linearGradient>
    <radialGradient id="ki-flare" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${primaryAura}" stop-opacity="0.35" />
      <stop offset="50%" stop-color="${coreAura}" stop-opacity="0.12" />
      <stop offset="100%" stop-color="${primaryAura}" stop-opacity="0" />
    </radialGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <style>
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-3px); }
      }
      @keyframes pulseAura {
        0%, 100% { opacity: 0.25; transform: scale(1.0); }
        50% { opacity: 0.5; transform: scale(1.06); }
      }
      @keyframes sparkFlicker {
        0%, 100% { opacity: 0.9; }
        50% { opacity: 0.1; }
      }
      .goku-stance {
        animation: float 2.8s ease-in-out infinite;
        transform-origin: center;
      }
      .aura-glow {
        animation: pulseAura ${(2.0 / aura.pulseSpeed).toFixed(2)}s ease-in-out infinite;
        transform-origin: 250px 120px;
      }
      .font-tech {
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
      }
      @media (prefers-reduced-motion: reduce) {
        .goku-stance, .aura-glow, .lightning { animation: none; }
      }
    </style>
  </defs>

  <rect x="2" y="2" width="${CARD_WIDTH - 4}" height="${CARD_HEIGHT - 4}" rx="14" fill="url(#bg-grad)" stroke="#1e293b" stroke-width="1.5" />

  <path d="M 12 24 L 24 12" stroke="#334155" stroke-width="2" />
  <path d="M 488 24 L 476 12" stroke="#334155" stroke-width="2" />

  <g class="font-tech">
    <path d="M 21 21 L 15 31 L 20 31 L 17 41 L 27 29 L 22 29 Z" fill="#f59e0b" />
    <text x="32" y="34" fill="#f59e0b" font-size="13" font-weight="800" letter-spacing="1.5">GIT-SAIYAN</text>
    <text x="150" y="34" fill="#64748b" font-size="11">| ${escapeXml(currentForm.saga)}</text>

    <text x="24" y="50" fill="#64748b" font-size="9">@${username}${joined}</text>

    <rect x="365" y="18" width="112" height="22" rx="4" fill="#1e1b4b" stroke="#4338ca" stroke-width="1" />
    <text x="421" y="33" fill="#a5b4fc" font-size="10" font-weight="700" text-anchor="middle">PL: ${stats.powerLevel.toLocaleString('en-US')}</text>
    <text x="421" y="50" fill="#64748b" font-size="8" text-anchor="middle">${ballsLabel}</text>
  </g>

  <circle cx="250" cy="125" r="78" fill="url(#ki-flare)" class="aura-glow" />

  ${particlesSvg}

  ${backBalls.map(({ ball, index }) => renderDragonBall(ball, index)).join('')}

  <g class="goku-stance">
    ${spriteToSvg(skinSprite, gokuX, gokuY, gokuScale)}
  </g>

  ${lightningSvg}

  ${frontBalls.map(({ ball, index }) => renderDragonBall(ball, index)).join('')}

  <g class="font-tech" text-anchor="middle">
    <text x="250" y="202" fill="#ffffff" font-size="15" font-weight="900" letter-spacing="2" filter="url(#glow)">${escapeXml(currentForm.name)}</text>
    <text x="250" y="217" fill="#94a3b8" font-size="9">${escapeXml(subtitle)}</text>
  </g>

  <g class="font-tech">
    <rect x="24" y="235" width="150" height="24" rx="4" fill="#18181b" stroke="#27272a" stroke-width="1" />
    <text x="32" y="251" fill="#f43f5e" font-size="9" font-weight="700">STREAK ${stats.currentStreak}D</text>
    <text x="112" y="251" fill="#64748b" font-size="9">BEST ${bestStreak}D</text>

    <g>
      <text x="184" y="238" fill="#64748b" font-size="8" font-weight="600">${escapeXml(nextLabel)}</text>
      <text x="304" y="238" fill="#64748b" font-size="8" text-anchor="end">${nextForm ? `+${contributionsToNext.toLocaleString('en-US')}` : 'MAX'}</text>
      <rect x="184" y="243" width="120" height="6" rx="3" fill="#27272a" />
      <rect x="184" y="243" width="${progressWidth}" height="6" rx="3" fill="${primaryAura}" />
    </g>

    <g>
      <text x="316" y="238" fill="#64748b" font-size="8" font-weight="600">KI 14D</text>
      ${activityBlocks}
    </g>
  </g>
</svg>`;
}
