import type { SaiyanForm } from '../engine/forms.js';

export interface PixelSprite {
  width: number;
  height: number;
  palette: Record<string, string>;
  frames: string[][]; // array of string arrays (rows)
}

/**
 * Star positions inside the 12x12 sphere (center is 5.5, 6.5).
 * Kept separate from the sphere so SVG can draw crisp vector stars and the GIF
 * renderer can draw larger dots instead of single illegible pixels.
 */
export const DRAGON_BALL_STARS: Record<number, [number, number][]> = {
  1: [[6, 6]],
  2: [[4, 6], [8, 6]],
  3: [[6, 4], [4, 7], [8, 7]],
  4: [[5, 5], [7, 5], [5, 7], [7, 7]], // Grandpa Gohan's ball
  5: [[6, 6], [4, 4], [8, 4], [4, 8], [8, 8]],
  6: [[4, 4], [8, 4], [4, 6], [8, 6], [4, 8], [8, 8]],
  7: [[6, 6], [4, 4], [8, 4], [4, 6], [8, 6], [4, 8], [8, 8]],
};

export function getDragonBallStarLayout(stars: number): [number, number][] {
  return DRAGON_BALL_STARS[Math.min(7, Math.max(1, Math.round(stars)))] ?? DRAGON_BALL_STARS[1];
}

/** 12x12 Dragon Ball sphere without stars. */
export function getDragonBallBaseSprite(): PixelSprite {
  const palette: Record<string, string> = {
    '.': 'transparent',
    'o': '#92400e', // dark outer rim
    'O': '#d97706', // rim
    'A': '#f59e0b', // amber base
    'L': '#fbbf24', // light amber
    'H': '#fef08a', // highlight reflection
  };

  const baseSphere = [
    '....oooo....',
    '..ooAAAAoo..',
    '.oAAALLLAAo.',
    '.oAALHHLLAA.',
    'oAALLHHLLAAo',
    'oAALLLLAAAAo',
    'oAAAALAAAAAo',
    'oAAAALAAAAAo',
    '.oAAAAAAAAo.',
    '.oAAAAAAAAo.',
    '..ooAAAAoo..',
    '....oooo....',
  ];

  return {
    width: 12,
    height: 12,
    palette,
    frames: [baseSphere],
  };
}
