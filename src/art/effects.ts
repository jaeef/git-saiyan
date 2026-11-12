/**
 * Ki-charge effects drawn around any character silhouette: a pixel flame
 * aura whose tongues rise over the loop, ki particles, and lightning.
 */
import { alphaMask, blendPixel, createImage, drawImage, forLine, type Image, type Vec } from './raster.js';

export type AuraIntensity = 'calm' | 'flaring' | 'super' | 'hyper';

export interface EffectStyle {
  intensity: AuraIntensity;
  primary: string;
  secondary: string;
  core: string;
  spark: string;
  particles: number;
  sparks: number;
}

const AURA_SHAPE: Record<AuraIntensity, { reach: number; rise: number; alpha: number }> = {
  calm: { reach: 1.4, rise: 2.5, alpha: 0.35 },
  flaring: { reach: 2.4, rise: 8, alpha: 0.5 },
  super: { reach: 3.2, rise: 11, alpha: 0.58 },
  hyper: { reach: 4, rise: 15, alpha: 0.66 },
};

const TAU = Math.PI * 2;

function hash(n: number): number {
  const value = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

/** Chamfer distance (in pixels) from every pixel to the nearest masked pixel. */
function distanceField(mask: Uint8Array, width: number, height: number): Float32Array {
  const far = width + height;
  const distance = new Float32Array(width * height);
  for (let i = 0; i < distance.length; i++) distance[i] = mask[i] ? 0 : far;
  const diagonal = Math.SQRT2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (x > 0) distance[i] = Math.min(distance[i], distance[i - 1] + 1);
      if (y > 0) {
        distance[i] = Math.min(distance[i], distance[i - width] + 1);
        if (x > 0) distance[i] = Math.min(distance[i], distance[i - width - 1] + diagonal);
        if (x < width - 1) distance[i] = Math.min(distance[i], distance[i - width + 1] + diagonal);
      }
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const i = y * width + x;
      if (x < width - 1) distance[i] = Math.min(distance[i], distance[i + 1] + 1);
      if (y < height - 1) {
        distance[i] = Math.min(distance[i], distance[i + width] + 1);
        if (x < width - 1) distance[i] = Math.min(distance[i], distance[i + width + 1] + diagonal);
        if (x > 0) distance[i] = Math.min(distance[i], distance[i + width - 1] + diagonal);
      }
    }
  }
  return distance;
}

function bounds(mask: Uint8Array, width: number, height: number) {
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!mask[y * width + x]) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  return { minX, maxX, minY, maxY, cx: (minX + maxX) / 2 };
}

/**
 * Compose one frame: aura behind, character, particles and lightning.
 * `t` is the loop position in [0, 1); every time term is a whole number of
 * cycles so the last frame flows back into the first.
 */
export function composeFrame(character: Image, style: EffectStyle, t: number, frameIndex: number, stage = 0): Image {
  const { width, height } = character;
  const mask = alphaMask(character);
  const distance = distanceField(mask, width, height);
  const box = bounds(mask, width, height);
  // Each power-up stage makes the aura reach further and rise higher.
  const base = AURA_SHAPE[style.intensity];
  const grow = 1 + 0.2 * stage;
  const shape = { reach: base.reach * grow, rise: base.rise * grow, alpha: Math.min(0.8, base.alpha + 0.05 * stage) };
  const frame = createImage(width, height);
  const sample = (x: number, y: number) =>
    y < 0 || y >= height ? Infinity : distance[Math.min(height - 1, Math.round(y)) * width + x];

  // --- Flame aura -----------------------------------------------------------
  for (let y = 0; y < height; y++) {
    if (y > box.maxY - 1) break;
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (mask[index]) continue;
      const column = 0.5 + 0.5 * Math.sin(x * 0.83 + 1.7 * Math.sin(x * 0.29 + TAU * t));
      const wave = 0.6 + 0.4 * Math.sin(y * 0.5 + 2 * TAU * t + x * 0.3);
      const lift = shape.rise * (0.3 + 0.7 * column) * wave;
      // Fade the flames out toward the feet so the aura sits on the ground.
      const groundFade = y > box.maxY - 6 ? 0.45 : 1;
      // ...and fade out before the top edge so tall flames never look clipped.
      const topFade = Math.min(1, (y + 1) / 14);

      const outer = sample(x, y + lift) <= shape.reach + 1.2;
      const inner = sample(x, y + lift * 0.55) <= shape.reach * 0.55;
      const core = sample(x, y + lift * 0.3) <= shape.reach * 0.3 && style.intensity !== 'calm';
      if (core) {
        blendPixel(frame, x, y, style.core, 0.7 * groundFade * topFade);
      } else if (inner) {
        blendPixel(frame, x, y, style.primary, Math.min(1, shape.alpha + 0.25) * groundFade * topFade);
      } else if (outer) {
        const outerColor = style.intensity === 'calm' ? style.primary : style.secondary;
        blendPixel(frame, x, y, outerColor, shape.alpha * groundFade * topFade);
      }
    }
  }

  // --- Particles behind the body -----------------------------------------------
  const particles: { x: number; y: number; size: number; alpha: number; front: boolean }[] = [];
  for (let i = 0; i < style.particles; i++) {
    const phase = (hash(i) + t * (1 + (i % 2))) % 1;
    const spread = (box.maxX - box.minX) / 2 + 8;
    const x = Math.round(box.cx + (hash(i + 31) * 2 - 1) * spread + Math.sin(TAU * (phase + hash(i + 7))) * 2);
    const y = Math.round(box.maxY - phase * (box.maxY - box.minY + 10));
    particles.push({
      x,
      y,
      size: hash(i + 13) > 0.6 ? 2 : 1,
      alpha: Math.sin(Math.PI * phase),
      front: i % 3 === 0,
    });
  }
  const drawParticle = (particle: (typeof particles)[number]) => {
    for (let dy = 0; dy < particle.size; dy++) {
      for (let dx = 0; dx < particle.size; dx++) {
        blendPixel(frame, particle.x + dx, particle.y + dy, style.core, Math.min(1, particle.alpha * 1.1));
      }
    }
  };
  particles.filter((particle) => !particle.front).forEach(drawParticle);

  drawImage(frame, character);

  // Power-up glow: a 1px rim of core light just outside the silhouette, on the
  // head and shoulders at stage 2/3 and around the whole body at stage 3/3.
  if (stage > 0) {
    const rimLimit = stage >= 2 ? box.maxY : box.minY + (box.maxY - box.minY) * 0.45;
    const pulse = 0.75 + 0.25 * Math.sin(TAU * t);
    for (let y = box.minY - 2; y <= rimLimit; y++) {
      for (let x = Math.max(0, box.minX - 2); x <= Math.min(width - 1, box.maxX + 2); x++) {
        if (y < 0 || y >= height) continue;
        const index = y * width + x;
        if (!mask[index] && distance[index] <= 1.2) {
          blendPixel(frame, x, y, style.core, (stage >= 2 ? 0.85 : 0.6) * pulse);
        }
      }
    }
  }
  particles.filter((particle) => particle.front).forEach(drawParticle);

  // --- Lightning ------------------------------------------------------------------
  for (let s = 0; s < style.sparks; s++) {
    if ((frameIndex + s * 3) % 4 > 1) continue; // crackle: visible on half the frames
    const seed = frameIndex * 17 + s * 101;
    const startX = box.cx + (hash(seed) * 2 - 1) * ((box.maxX - box.minX) / 2 + 2);
    const startY = box.minY + 6 + hash(seed + 1) * (box.maxY - box.minY) * 0.6;
    const direction = startX < box.cx ? -1 : 1;
    const points: Vec[] = [[startX, startY]];
    // Short zigzag that climbs and alternates sides, staying inside the aura.
    for (let segment = 0; segment < 4; segment++) {
      const [px, py] = points[points.length - 1];
      const zig = segment % 2 === 0 ? 1 : -1;
      points.push([
        px + direction * zig * (1.5 + hash(seed + segment * 3 + 2) * 2.5),
        py - (2 + hash(seed + segment * 3 + 3) * 3),
      ]);
    }
    for (let segment = 0; segment < points.length - 1; segment++) {
      forLine(points[segment], points[segment + 1], (x, y) => {
        blendPixel(frame, x, y, style.spark, 1);
      });
    }
    for (const [px, py] of points.slice(1, -1)) blendPixel(frame, Math.round(px), Math.round(py), '#ffffff', 1);
  }

  return frame;
}
