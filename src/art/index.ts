/**
 * Character frame pipeline shared by the SVG and GIF renderers.
 * Produces FRAME_COUNT RGBA frames (aura + character + effects) on a
 * CANVAS_WIDTH x CANVAS_HEIGHT canvas; renderers display them at an integer scale.
 */
import type { SaiyanForm } from '../engine/forms.js';
import type { AuraTier } from '../engine/streak.js';
import { GROUND, renderGokuFrame } from './goku.js';
import { composeFrame, type EffectStyle } from './effects.js';
import type { Image } from './raster.js';

export { CANVAS_HEIGHT, CANVAS_WIDTH } from './goku.js';

export { renderGokuFrame } from './goku.js';
export const FRAME_COUNT = 8;
export const FRAME_DELAY_MS = 110;
/** Display scale: every canvas pixel becomes a 2x2 block on the card. */
export const DISPLAY_SCALE = 2;
/** Canvas row where the character's feet rest. */
export const FEET_Y = GROUND;


const cache = new Map<string, Image[]>();

/**
 * `stage` (0-2) is the power-up stage inside the form: each stage grows the
 * aura and adds a brighter hair and silhouette glow.
 */
export function renderCharacterFrames(form: SaiyanForm, aura: AuraTier, stage = 0): Image[] {
  const key = `${form.id}:${stage}:${aura.intensity}:${aura.particleCount}:${aura.sparkCount}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const style: EffectStyle = {
    intensity: aura.intensity,
    primary: form.auraColors.primary,
    secondary: form.auraColors.secondary,
    core: form.auraColors.core,
    spark: form.sparkColor ?? '#7dd3fc',
    particles: aura.particleCount,
    sparks: aura.sparkCount,
  };

  const frames: Image[] = [];
  for (let index = 0; index < FRAME_COUNT; index++) {
    const t = index / FRAME_COUNT;
    frames.push(composeFrame(renderGokuFrame(form.id, t, stage), style, t, index, stage));
  }
  cache.set(key, frames);
  return frames;
}
