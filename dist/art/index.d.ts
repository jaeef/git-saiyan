/**
 * Character frame pipeline shared by the SVG and GIF renderers.
 * Produces FRAME_COUNT RGBA frames (aura + character + effects) on a
 * CANVAS_WIDTH x CANVAS_HEIGHT canvas; renderers display them at an integer scale.
 */
import type { SaiyanForm } from '../engine/forms.js';
import type { AuraTier } from '../engine/streak.js';
import type { Image } from './raster.js';
export { CANVAS_HEIGHT, CANVAS_WIDTH } from './goku.js';
export { renderGokuFrame } from './goku.js';
export declare const FRAME_COUNT = 8;
export declare const FRAME_DELAY_MS = 110;
/** Display scale: every canvas pixel becomes a 2x2 block on the card. */
export declare const DISPLAY_SCALE = 2;
/** Canvas row where the character's feet rest. */
export declare const FEET_Y = 110;
/**
 * `stage` (0-2) is the power-up stage inside the form: each stage grows the
 * aura and adds a brighter hair and silhouette glow.
 */
export declare function renderCharacterFrames(form: SaiyanForm, aura: AuraTier, stage?: number): Image[];
