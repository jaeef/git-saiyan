/**
 * Dev helper: render a contact sheet of character frames to a PNG.
 * Usage: tsx scripts/preview-art.ts out.png [forms,comma] [streak] [frames] [scale]
 */
import fs from 'node:fs';
import { GOKU_FORMS } from '../src/engine/forms.js';
import { calculateAuraFromStreak } from '../src/engine/streak.js';
import { renderCharacterFrames, CANVAS_WIDTH, CANVAS_HEIGHT } from '../src/art/index.js';
import { createImage, drawImage, blendPixel } from '../src/art/raster.js';
import { encodePng } from '../src/art/png.js';

const [out = 'preview.png', formList, streakArg = '21', framesArg = '1', scaleArg = '3'] = process.argv.slice(2);
const forms = formList ? formList.split(',') : GOKU_FORMS.map((form) => form.id);
const frameCount = Number(framesArg);
const sheet = createImage(CANVAS_WIDTH * forms.length, CANVAS_HEIGHT * frameCount);
for (let y = 0; y < sheet.height; y++) for (let x = 0; x < sheet.width; x++) blendPixel(sheet, x, y, '#0d1117');
forms.forEach((formId, column) => {
  const form = GOKU_FORMS.find((item) => item.id === formId);
  if (!form) throw new Error(`unknown form ${formId}`);
  const frames = renderCharacterFrames(form, calculateAuraFromStreak(Number(streakArg), form.hasSparks));
  for (let row = 0; row < frameCount; row++) {
    drawImage(sheet, frames[row * Math.floor(frames.length / frameCount)], column * CANVAS_WIDTH, row * CANVAS_HEIGHT);
  }
});
fs.writeFileSync(out, encodePng(sheet, Number(scaleArg)));
console.log(`wrote ${out}`);
