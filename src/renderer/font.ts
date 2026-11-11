/**
 * Tiny 3x5 bitmap font for the GIF renderer. GitHub's SVG output uses real
 * text, but the GIF needs its own glyphs so it can carry the same HUD.
 */
const GLYPHS: Record<string, string[]> = {
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  J: ['001', '001', '001', '101', '010'],
  K: ['101', '101', '110', '101', '101'],
  L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '111', '101', '101'],
  N: ['101', '111', '111', '111', '101'],
  O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'],
  Q: ['010', '101', '101', '111', '011'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'],
  V: ['101', '101', '101', '101', '010'],
  W: ['101', '101', '111', '111', '101'],
  X: ['101', '101', '010', '101', '101'],
  Y: ['101', '101', '010', '010', '010'],
  Z: ['111', '001', '010', '100', '111'],
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['110', '001', '010', '100', '111'],
  '3': ['110', '001', '010', '001', '110'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '110', '001', '110'],
  '6': ['011', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '110'],
  ' ': ['000', '000', '000', '000', '000'],
  ':': ['000', '010', '000', '010', '000'],
  '-': ['000', '000', '111', '000', '000'],
  '.': ['000', '000', '000', '000', '010'],
  '/': ['001', '001', '010', '100', '100'],
  '%': ['101', '001', '010', '100', '101'],
  '+': ['000', '010', '111', '010', '000'],
  ',': ['000', '000', '000', '010', '100'],
  '!': ['010', '010', '010', '000', '010'],
  "?": ['110', '001', '010', '000', '010'],
  "'": ['010', '010', '000', '000', '000'],
  '@': ['010', '101', '111', '100', '011'],
  '#': ['101', '111', '101', '111', '101'],
  '(': ['001', '010', '010', '010', '001'],
  ')': ['100', '010', '010', '010', '100'],
};

const GLYPH_WIDTH = 3;
const GLYPH_HEIGHT = 5;
const LETTER_SPACING = 1;

export interface TextRect {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

export function textWidth(text: string, scale: number, letterSpacing = LETTER_SPACING): number {
  const length = [...text].length;
  if (length === 0) return 0;
  return (length * GLYPH_WIDTH + (length - 1) * letterSpacing) * scale;
}

export function textToRects(
  text: string,
  x: number,
  y: number,
  scale: number,
  color: string
): TextRect[] {
  const rects: TextRect[] = [];
  let cursor = x;

  // The 3x5 set has no typographic punctuation; normalize it before lookup so
  // form titles like "Earth's Greatest Defender" do not render as EARTH?S.
  const normalized = text
    .toUpperCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u00B7/g, '-');

  for (const character of normalized) {
    const glyph = GLYPHS[character] ?? GLYPHS['?'];
    for (let row = 0; row < GLYPH_HEIGHT; row++) {
      let runStart = -1;
      for (let col = 0; col <= GLYPH_WIDTH; col++) {
        const on = col < GLYPH_WIDTH && glyph[row][col] === '1';
        if (on && runStart < 0) runStart = col;
        if (!on && runStart >= 0) {
          rects.push({
            x: cursor + runStart * scale,
            y: y + row * scale,
            w: (col - runStart) * scale,
            h: scale,
            color,
          });
          runStart = -1;
        }
      }
    }
    cursor += (GLYPH_WIDTH + LETTER_SPACING) * scale;
  }

  return rects;
}
