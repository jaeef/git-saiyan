import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import type { ContributionStats } from '../api/types.js';
import { calculateDragonBalls } from '../engine/dragonballs.js';
import { buildCardModel } from '../engine/card.js';
import {
  getDragonBallBaseSprite,
  getDragonBallStarLayout,
} from '../assets/sprites.js';
import {
  CANVAS_WIDTH,
  DISPLAY_SCALE,
  FEET_Y,
  FRAME_COUNT,
  FRAME_DELAY_MS,
  renderCharacterFrames,
} from '../art/index.js';
import { textToRects, textWidth } from './font.js';

const WIDTH = 500;
const HEIGHT = 300;
const ORBIT = { centerX: 250, centerY: 172, radiusX: 168, radiusY: 42 };
const GROUND_Y = 266;
const HORIZON_Y = 236;

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
  const totalFrames = FRAME_COUNT;
  const delayMs = FRAME_DELAY_MS;

  const card = buildCardModel(stats);
  const { currentForm, nextForm, progressPercent, contributionsToNext, aura, unlockedBalls, nextBall, stage, eta, streak } = card;
  const characterFrames = renderCharacterFrames(currentForm, aura, stage);
  const baseBall = getDragonBallBaseSprite();
  const frames: Uint8ClampedArray[] = [];
  let background: Uint8ClampedArray | null = null;

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
      sprite: typeof baseBall,
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

    const [auraR, auraG, auraB] = hexToRgba(currentForm.auraColors.primary);

    /** Fill a polygon; `shade` may vary the color per column (for gradients). */
    const fillPolygon = (
      points: [number, number][],
      shade: (x: number) => [number, number, number],
      a = 255
    ) => {
      const xs = points.map((p) => p[0]);
      const ys = points.map((p) => p[1]);
      for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
        for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
          let inside = false;
          for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const [xi, yi] = points[i];
            const [xj, yj] = points[j];
            if (yi > y + 0.5 !== yj > y + 0.5 && x + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi) inside = !inside;
          }
          if (inside) {
            const [r, g, b] = shade(x);
            setPixel(x, y, r, g, b, a);
          }
        }
      }
    };
    const drawLine = (x1: number, y1: number, x2: number, y2: number, r: number, g: number, b: number, a: number) => {
      const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
      for (let step = 0; step <= steps; step++) {
        const t = steps === 0 ? 0 : step / steps;
        setPixel(Math.round(x1 + (x2 - x1) * t), Math.round(y1 + (y2 - y1) * t), r, g, b, a);
      }
    };
    const outline = (points: [number, number][], r: number, g: number, b: number) => {
      points.forEach(([x, y], i) => {
        const [nx, ny] = points[(i + 1) % points.length];
        drawLine(x, y, nx, ny, r, g, b, 255);
      });
    };
    const rightText = (value: string, right: number, y: number, scale: number, color: string) =>
      drawText(value, Math.round(right - textWidth(value, scale)), y, scale, color);
    const centerText = (value: string, center: number, y: number, scale: number, color: string) =>
      drawText(value, Math.round(center - textWidth(value, scale) / 2), y, scale, color);

    // --- Arena: sky, spotlight, floor grid (identical every frame) -----------------
    if (background) {
      rgba.set(background);
    } else {
      for (let y = 0; y < HEIGHT; y++) {
        const t = y / HEIGHT;
        const mixTo = t < 0.75 ? t / 0.75 : 1 - (t - 0.75) / 0.25;
        fillRect(0, y, WIDTH, 1, Math.round(11 + 15 * mixTo), Math.round(8 + 8 * mixTo), Math.round(32 + 21 * mixTo), 255);
      }
      for (let y = 130; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
          const d = Math.hypot((x - 250) / 260, (y - 250) / 120);
          if (d < 1) setPixel(x, y, auraR, auraG, auraB, Math.round(90 * (1 - d)));
        }
      }
      fillRect(0, HORIZON_Y, WIDTH, HEIGHT - HORIZON_Y, 18, 12, 38, 255);
      for (let i = 0; i < 9; i++) drawLine(250, HORIZON_Y, -200 + i * 112, HEIGHT, auraR, auraG, auraB, 46);
      drawLine(0, HORIZON_Y, WIDTH - 1, HORIZON_Y, auraR, auraG, auraB, 115);
      for (let y = GROUND_Y - 10; y <= GROUND_Y + 6; y++) {
        for (let x = 188; x <= 312; x++) {
          if (((x - 250) / 62) ** 2 + ((y - (GROUND_Y - 2)) / 8) ** 2 <= 1) setPixel(x, y, 0, 0, 0, 115);
        }
      }
      background = rgba.slice();
    }

    // --- Dragon Balls orbit Goku: back half, character, front half --------------------
    const dragonBalls = calculateDragonBalls(unlockedBalls, timeProgress, ORBIT);
    for (const ball of dragonBalls.filter((item) => item.z < 0)) drawDragonBall(ball);

    const sprite = characterFrames[frameIndex % characterFrames.length];
    const originX = 250 - (CANVAS_WIDTH * DISPLAY_SCALE) / 2;
    const originY = GROUND_Y - FEET_Y * DISPLAY_SCALE;
    for (let y = 0; y < sprite.height; y++) {
      for (let x = 0; x < sprite.width; x++) {
        const index = (y * sprite.width + x) * 4;
        const alpha = sprite.data[index + 3];
        if (alpha === 0) continue;
        fillRect(originX + x * DISPLAY_SCALE, originY + y * DISPLAY_SCALE, DISPLAY_SCALE, DISPLAY_SCALE, sprite.data[index], sprite.data[index + 1], sprite.data[index + 2], alpha);
      }
    }

    for (const ball of dragonBalls.filter((item) => item.z >= 0)) drawDragonBall(ball);

    // Card border.
    fillRect(1, 1, WIDTH - 2, 1, 49, 46, 129, 255);
    fillRect(1, HEIGHT - 2, WIDTH - 2, 1, 49, 46, 129, 255);
    fillRect(1, 1, 1, HEIGHT - 2, 49, 46, 129, 255);
    fillRect(WIDTH - 2, 1, 1, HEIGHT - 2, 49, 46, 129, 255);

    // --- Name plate and health bar (progress to the next form) ------------------------
    const plate: [number, number][] = [[14, 14], [214, 14], [204, 38], [14, 38]];
    fillPolygon(plate, () => [15, 10, 36]);
    outline(plate, auraR, auraG, auraB);
    drawText(currentForm.name, 24, 21, 2, '#ffffff');

    const hpWidth = 190;
    fillPolygon([[14, 44], [14 + hpWidth, 44], [6 + hpWidth, 56], [14, 56]], () => [31, 22, 64]);
    const hpFill = Math.round((progressPercent / 100) * hpWidth);
    if (hpFill > 0) {
      fillPolygon([[14, 44], [14 + hpFill, 44], [Math.max(14, 6 + hpFill), 56], [14, 56]], (x) => {
        const t = Math.min(1, Math.max(0, (x - 14) / hpWidth));
        return [Math.round(253 + (auraR - 253) * t), Math.round(224 + (auraG - 224) * t), Math.round(71 + (auraB - 71) * t)];
      });
    }
    for (const fraction of [1 / 3, 2 / 3]) {
      const x = 14 + Math.round(fraction * hpWidth);
      drawLine(x, 44, x - 4, 56, 11, 8, 32, 255);
    }
    const nextLine = nextForm
      ? `NEXT ${nextForm.name} +${formatCompact(contributionsToNext)} ${eta?.short ?? ''}`
      : 'FINAL FORM REACHED';
    drawText(nextLine, 14, 63, 1, '#c4b5fd');
    drawText(`@${stats.username} - ${currentForm.saga}`, 14, 74, 1, '#7c6fb0');

    // --- Round timer = current streak -------------------------------------------------
    fillRect(224, 8, 52, 52, 15, 10, 36, 255);
    outline([[224, 8], [275, 8], [275, 59], [224, 59]], 253, 224, 71);
    centerText(String(streak.current), 250, 15, 3, '#fde047');
    centerText(`${streak.noun.toUpperCase()} STREAK`, 250, 38, 1, '#fde047');
    centerText(`BEST ${streak.best}${streak.unit}`, 250, 48, 1, '#a78bfa');

    // --- Power level and Dragon Balls ---------------------------------------------------
    rightText('POWER LEVEL', 486, 14, 1, '#c4b5fd');
    rightText(stats.powerLevel.toLocaleString('en-US'), 486, 24, 3, '#fde047');
    rightText(`DRAGON BALLS ${unlockedBalls}/7`, 486, 47, 1, '#c4b5fd');
    rightText(nextBall ? `NEXT BALL ${nextBall.star} AT ${formatCompact(nextBall.at)} THIS YEAR` : 'SHENRON SUMMONED THIS YEAR', 486, 57, 1, '#7c6fb0');

    // --- Bottom: 14-day ki bars and power-up stage ----------------------------------------
    drawText('KI - 14 DAYS', 16, 254, 1, '#c4b5fd');
    stats.recentDays.forEach((day, index) => {
      const height = 4 + Math.min(day.count, 6) * 2;
      const [r, g, b] = day.count > 0 ? (day.count > 3 ? [253, 224, 71] : [202, 138, 4]) : [42, 32, 80];
      fillRect(16 + index * 9, 286 - height, 8, height, r, g, b, 255);
    });
    rightText(`STAGE ${stage + 1}/3`, 484, 257, 1, '#c4b5fd');
    for (let pip = 0; pip < 3; pip++) {
      const lit = pip <= stage;
      fillRect(446 + pip * 13, 270, 10, 10, lit ? auraR : 42, lit ? auraG : 32, lit ? auraB : 80, 255);
    }

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
