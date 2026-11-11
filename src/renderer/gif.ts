import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import type { ContributionStats } from '../api/types.js';
import { calculateFormProgression } from '../engine/forms.js';
import {
  calculateDragonBalls,
  calculateUnlockedBalls,
  nextDragonBallMilestone,
} from '../engine/dragonballs.js';
import { calculateAuraFromStreak } from '../engine/streak.js';
import {
  getDragonBallBaseSprite,
  getDragonBallStarLayout,
  getGokuSprite,
} from '../assets/sprites.js';
import { generateKiAuraParticles, generateLightningArcs } from './particles.js';
import { textToRects, textWidth } from './font.js';

const WIDTH = 500;
const HEIGHT = 280;
const ORBIT = { centerX: 250, centerY: 132, radiusX: 188, radiusY: 52 };

function hexToRgba(hex: string, alpha: number = 255): [number, number, number, number] {
  if (hex === 'transparent' || !hex) return [0, 0, 0, 0];
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((character) => character + character)
      .join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return [r, g, b, Math.round(alpha)];
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(value);
}

export function renderGif(stats: ContributionStats): Uint8Array {
  const totalFrames = 8;
  const delayMs = 110;

  const effectiveContributions = stats.peakContributions ?? stats.totalContributions;
  const { currentForm, nextForm, progressPercent, contributionsToNext } =
    calculateFormProgression(effectiveContributions);
  const aura = calculateAuraFromStreak(stats.currentStreak, currentForm.hasSparks);
  const unlockedBalls = stats.unlockedBalls ?? calculateUnlockedBalls(effectiveContributions);
  const bestStreak = stats.bestStreak ?? stats.longestStreak;
  const nextBall = nextDragonBallMilestone(effectiveContributions);
  const gokuSprite = getGokuSprite(currentForm.id);
  const baseBall = getDragonBallBaseSprite();
  const gokuScale = 4;
  const frames: Uint8ClampedArray[] = [];

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    const timeProgress = frameIndex / totalFrames;
    const rgba = new Uint8ClampedArray(WIDTH * HEIGHT * 4);

    const setPixel = (x: number, y: number, r: number, g: number, b: number, a: number) => {
      if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT || a <= 0) return;
      const index = (y * WIDTH + x) * 4;
      if (a >= 255) {
        rgba[index] = r;
        rgba[index + 1] = g;
        rgba[index + 2] = b;
        rgba[index + 3] = 255;
      } else {
        const factor = a / 255;
        rgba[index] = Math.round(rgba[index] * (1 - factor) + r * factor);
        rgba[index + 1] = Math.round(rgba[index + 1] * (1 - factor) + g * factor);
        rgba[index + 2] = Math.round(rgba[index + 2] * (1 - factor) + b * factor);
      }
    };

    const fillRect = (x: number, y: number, w: number, h: number, r: number, g: number, b: number, a: number) => {
      for (let py = y; py < y + h; py++) {
        for (let px = x; px < x + w; px++) {
          setPixel(px, py, r, g, b, a);
        }
      }
    };

    const drawSprite = (
      sprite: typeof gokuSprite,
      spriteFrame: number,
      startX: number,
      startY: number,
      scale: number,
      opacity: number = 1
    ) => {
      const frame = sprite.frames[spriteFrame % sprite.frames.length];
      const pixel = Math.max(1, Math.round(scale));
      for (let row = 0; row < frame.length; row++) {
        const line = frame[row];
        for (let col = 0; col < line.length; col++) {
          const hex = sprite.palette[line[col]];
          if (!hex || hex === 'transparent') continue;
          const [r, g, b] = hexToRgba(hex);
          fillRect(
            Math.round(startX + col * scale),
            Math.round(startY + row * scale),
            pixel,
            pixel,
            r,
            g,
            b,
            Math.round(255 * opacity)
          );
        }
      }
    };

    const drawCircle = (cx: number, cy: number, radius: number, r: number, g: number, b: number, a: number) => {
      const centerX = Math.round(cx);
      const centerY = Math.round(cy);
      const safeRadius = Math.max(1, Math.round(radius));
      const radiusSquared = safeRadius * safeRadius;
      for (let y = centerY - safeRadius; y <= centerY + safeRadius; y++) {
        for (let x = centerX - safeRadius; x <= centerX + safeRadius; x++) {
          if ((x - centerX) ** 2 + (y - centerY) ** 2 <= radiusSquared) {
            setPixel(x, y, r, g, b, a);
          }
        }
      }
    };

    const drawText = (text: string, x: number, y: number, scale: number, color: string) => {
      const [r, g, b] = hexToRgba(color);
      for (const rect of textToRects(text, x, y, scale, color)) {
        fillRect(rect.x, rect.y, rect.w, rect.h, r, g, b, 255);
      }
    };

    const drawDragonBall = (ball: ReturnType<typeof calculateDragonBalls>[number]) => {
      const scale = 1.8 * ball.scale;
      const spriteWidth = baseBall.width * scale;
      const spriteHeight = baseBall.height * scale;
      drawSprite(
        baseBall,
        0,
        ball.x - spriteWidth / 2,
        ball.y - spriteHeight / 2,
        scale,
        ball.opacity
      );

      for (const [starX, starY] of getDragonBallStarLayout(ball.star)) {
        drawCircle(
          ball.x + (starX - 5.5) * scale,
          ball.y + (starY - 6.5) * scale,
          Math.max(1, 1.15 * scale),
          220,
          38,
          38,
          Math.round(255 * ball.opacity)
        );
      }
    };

    // Background gradient
    for (let y = 0; y < HEIGHT; y++) {
      const t = y / HEIGHT;
      fillRect(
        0,
        y,
        WIDTH,
        1,
        Math.round(9 + (5 - 9) * t),
        Math.round(13 + (8 - 13) * t),
        Math.round(22 + (17 - 22) * t),
        255
      );
    }

    // Border
    fillRect(2, 2, WIDTH - 4, 1, 30, 41, 59, 255);
    fillRect(2, HEIGHT - 3, WIDTH - 4, 1, 30, 41, 59, 255);
    fillRect(2, 2, 1, HEIGHT - 4, 30, 41, 59, 255);
    fillRect(WIDTH - 3, 2, 1, HEIGHT - 4, 30, 41, 59, 255);

    // Header
    drawText('GIT-SAIYAN', 24, 18, 2, '#f59e0b');
    fillRect(365, 16, 112, 22, 30, 27, 75, 255);
    drawText(`PL ${formatCompact(stats.powerLevel)}`, 373, 22, 2, '#a5b4fc');
    drawText(`BALLS ${unlockedBalls}/7`, 373, 42, 1, '#64748b');
    drawText(`@${stats.username}`, 24, 44, 1, '#64748b');

    // Aura
    const [auraR, auraG, auraB] = hexToRgba(currentForm.auraColors.primary);
    const auraPulse = Math.sin(timeProgress * Math.PI * 2) * 6;
    drawCircle(250, 125, 58 + auraPulse, auraR, auraG, auraB, 45);
    drawCircle(250, 125, 38 + auraPulse, auraR, auraG, auraB, 75);

    // Dragon Balls behind
    const dragonBalls = calculateDragonBalls(unlockedBalls, timeProgress, ORBIT);
    for (const ball of dragonBalls.filter((item) => item.z < 0)) {
      drawDragonBall(ball);
    }

    // Particles
    for (const particle of generateKiAuraParticles(
      timeProgress,
      250,
      132,
      aura.particleCount,
      currentForm.auraColors.primary,
      currentForm.auraColors.core
    )) {
      const [r, g, b] = hexToRgba(particle.color);
      drawCircle(particle.x, particle.y, particle.radius, r, g, b, Math.round(particle.opacity * 255));
    }

    // Goku
    const sway = Math.round(Math.sin(timeProgress * Math.PI * 2) * 2);
    drawSprite(
      gokuSprite,
      frameIndex % 2,
      250 - (gokuSprite.width * gokuScale) / 2,
      116 - (gokuSprite.height * gokuScale) / 2 + sway,
      gokuScale,
      1
    );

    // Lightning
    for (const arc of generateLightningArcs(
      timeProgress,
      250,
      120,
      aura.sparkCount,
      currentForm.sparkColor || '#38bdf8'
    )) {
      const [r, g, b] = hexToRgba(arc.color);
      for (let point = 0; point < arc.points.length - 1; point++) {
        const [x1, y1] = arc.points[point];
        const [x2, y2] = arc.points[point + 1];
        const distance = Math.hypot(x2 - x1, y2 - y1);
        for (let step = 0; step <= distance; step++) {
          const t = step / (distance || 1);
          setPixel(
            Math.round(x1 + (x2 - x1) * t),
            Math.round(y1 + (y2 - y1) * t),
            r,
            g,
            b,
            240
          );
        }
      }
    }

    // Dragon Balls in front
    for (const ball of dragonBalls.filter((item) => item.z >= 0)) {
      drawDragonBall(ball);
    }

    // Form name
    const titleWidth = textWidth(currentForm.name, 2);
    drawText(currentForm.name, Math.round(250 - titleWidth / 2), 194, 2, '#ffffff');
    const subtitle = `${currentForm.title}${nextBall ? ` - NEXT BALL ${nextBall.star} AT ${formatCompact(nextBall.at)}` : ''}`;
    const subtitleWidth = textWidth(subtitle, 1);
    drawText(subtitle, Math.round(250 - subtitleWidth / 2), 210, 1, '#94a3b8');

    // Bottom HUD
    fillRect(24, 235, 150, 24, 24, 24, 27, 255);
    drawText(`STREAK ${stats.currentStreak}D`, 30, 242, 2, '#f43f5e');
    drawText(`BEST ${bestStreak}D`, 120, 242, 1, '#64748b');

    const nextLabel = nextForm ? `NEXT ${nextForm.name}` : 'MAX FORM';
    drawText(nextLabel, 184, 236, 1, '#64748b');
    if (nextForm) {
      const toGo = `+${formatCompact(contributionsToNext)}`;
      drawText(toGo, Math.round(304 - textWidth(toGo, 1)), 236, 1, '#64748b');
    }
    fillRect(184, 244, 120, 6, 39, 39, 42, 255);
    fillRect(184, 244, Math.round((progressPercent / 100) * 120), 6, auraR, auraG, auraB, 255);

    drawText('KI 14D', 316, 236, 1, '#64748b');
    stats.recentDays.forEach((day, index) => {
      const x = 316 + index * 11;
      const intensity = Math.min(day.count, 6);
      const height = 4 + intensity * 2;
      const y = 256 - height;
      const [r, g, b] =
        day.count > 0 ? (day.count > 3 ? [34, 197, 94] : [21, 128, 61]) : [51, 65, 85];
      fillRect(x, y, 8, height, r, g, b, 255);
    });

    frames.push(rgba);
  }

  // One shared palette for all frames keeps the GIF smaller and consistent.
  const combined = new Uint8ClampedArray(WIDTH * HEIGHT * 4 * frames.length);
  frames.forEach((frame, index) => combined.set(frame, index * WIDTH * HEIGHT * 4));
  const palette = quantize(combined, 256);

  const gif = GIFEncoder();
  frames.forEach((frame, index) => {
    const indexed = applyPalette(frame, palette);
    // The first frame carries the global color table; later frames must not
    // repeat it as a local table (that would inflate the GIF).
    const options = index === 0 ? { palette, delay: delayMs, repeat: 0 } : { delay: delayMs };
    gif.writeFrame(indexed, WIDTH, HEIGHT, options);
  });
  gif.finish();

  return gif.bytes();
}
