import type { SaiyanForm } from '../engine/forms.js';
export interface PixelSprite {
    width: number;
    height: number;
    palette: Record<string, string>;
    frames: string[][];
}
/**
 * Star positions inside the 12x12 sphere (center is 5.5, 6.5).
 * Kept separate from the sphere so SVG can draw crisp vector stars and the GIF
 * renderer can draw larger dots instead of single illegible pixels.
 */
export declare const DRAGON_BALL_STARS: Record<number, [number, number][]>;
export declare function getDragonBallStarLayout(stars: number): [number, number][];
/** 12x12 Dragon Ball sphere without stars. */
export declare function getDragonBallBaseSprite(): PixelSprite;
export declare function getGokuSprite(formId: string): PixelSprite;
export declare function getNovaSprite(formId: string, form?: SaiyanForm): PixelSprite;
/**
 * Resolve the sprite for any skin/form combination. Goku keeps its own
 * hand-drawn sprite table; NOVA uses palette-swapped original art.
 */
export declare function getSkinSprite(skinId: string, form: SaiyanForm): PixelSprite;
