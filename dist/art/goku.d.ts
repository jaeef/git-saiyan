/**
 * Goku character rig (unofficial fan art).
 *
 * One parametric ki-charge pose (fists clenched at the hips, wide stance)
 * built from shaded primitives. Each form swaps the hair sculpt, palette,
 * eyes and outfit; each animation frame re-renders the rig with the hair,
 * sash and breathing moved slightly, so frames stay consistent.
 */
import { type Image } from './raster.js';
export declare const CANVAS_WIDTH = 128;
export declare const CANVAS_HEIGHT = 120;
/** Canvas row the feet stand on. */
export declare const GROUND = 110;
/**
 * Render one animation frame (t in [0, 1)) of a Goku form. Feet rest on
 * GROUND (Kid Goku: on the cloud), centered horizontally. `stage` (0-2) is the
 * power-up stage, which brightens the hair.
 */
export declare function renderGokuFrame(formId: string, t: number, stage?: number): Image;
