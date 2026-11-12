/**
 * Ki-charge effects drawn around any character silhouette: a pixel flame
 * aura whose tongues rise over the loop, ki particles, and lightning.
 */
import { type Image } from './raster.js';
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
/**
 * Compose one frame: aura behind, character, particles and lightning.
 * `t` is the loop position in [0, 1); every time term is a whole number of
 * cycles so the last frame flows back into the first.
 */
export declare function composeFrame(character: Image, style: EffectStyle, t: number, frameIndex: number, stage?: number): Image;
