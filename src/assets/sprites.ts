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

// 24x30 pixel art character frames for Goku forms
export function getGokuSprite(formId: string): PixelSprite {
  // Palettes per form
  const commonPalette: Record<string, string> = {
    '.': 'transparent',
    'O': '#0f172a', // outline
    'S': '#ffedd5', // skin
    's': '#f97316', // skin shade
    'G': '#ea580c', // gi orange
    'g': '#9a3412', // gi shadow
    'B': '#1d4ed8', // undershirt/belt blue
    'b': '#1e3a8a', // boot blue
    'W': '#ffffff', // white (eyes/wristband)
    'N': '#fde047', // nimbus yellow
    'P': '#dc2626', // power pole red
  };

  let hairColor = '#0f172a';
  let hairLight = '#334155';
  let eyeColor = '#0f172a';

  if (formId === 'kaioken') {
    hairColor = '#450a0a';
    hairLight = '#7f1d1d';
    eyeColor = '#dc2626';
  } else if (formId === 'ssj1') {
    hairColor = '#eab308';
    hairLight = '#fef08a';
    eyeColor = '#06b6d4';
  } else if (formId === 'ssj2') {
    hairColor = '#facc15';
    hairLight = '#fef9c3';
    eyeColor = '#22d3ee';
  } else if (formId === 'ssj3') {
    hairColor = '#eab308';
    hairLight = '#fef08a';
    eyeColor = '#06b6d4';
  } else if (formId === 'ssj4') {
    hairColor = '#0f172a';
    hairLight = '#334155';
    eyeColor = '#eab308';
    commonPalette['G'] = '#b91c1c'; // GT red fur
    commonPalette['g'] = '#7f1d1d';
  } else if (formId === 'ssjg') {
    hairColor = '#e11d48';
    hairLight = '#fda4af';
    eyeColor = '#f43f5e';
  } else if (formId === 'ssjb') {
    hairColor = '#0284c7';
    hairLight = '#7dd3fc';
    eyeColor = '#38bdf8';
  } else if (formId === 'mui') {
    hairColor = '#e2e8f0';
    hairLight = '#ffffff';
    eyeColor = '#cbd5e1';
  }

  const palette: Record<string, string> = {
    ...commonPalette,
    'H': hairColor,
    'h': hairLight,
    'E': eyeColor,
  };

  // Base Adult Goku Template (24x30)
  // Frame 1: Stance
  const adultFrame1 = [
    '........HHHHHHHH........',
    '......HHHHHHHHHHHH......',
    '....HHHHhhhhHHHHHHHH....',
    '...HHHHhhhhhhHHHHHHHH...',
    '..HHHHHhhhhhhHHHHHHHHH..',
    '..HHHHhhSSSSSSssHHHHHH..',
    '...HHhhSWESSSsEWsHHHH...',
    '....HhhSSSSSSssshHHH....',
    '.....HhhSSssSSssHHH.....',
    '......HhhSSssshHH.......',
    '.......OOssssOO.........',
    '.....OOBBBBBBBBOO.......',
    '...OOGGBBBBBBBBGGOO.....',
    '..OOGGGGBBBBBBGGGGGO....',
    '..OGGGGGGBBBBGGGGGGO....',
    '..OGGGGGGOBBOGGGGGGO....',
    '..OGGGGGGOOOGGGGGGGO....',
    '...OGGGGGGBBGGGGGGO.....',
    '...OOBBBBBBBBBBBBOO.....',
    '....OBBBBBBBBBBBBO......',
    '....OGGGGGGGGGGGGO......',
    '....OGGGGG..GGGGGO......',
    '....OGGGGG..GGGGGO......',
    '....OGGGGG..GGGGGO......',
    '....OGGGGG..GGGGGO......',
    '....Obbbbb..bbbbbO......',
    '....Obbbbb..bbbbbO......',
    '...Obbbbbb..bbbbbbO.....',
    '...ObWWWWb..bWWWWbO.....',
    '....OOOOOO..OOOOOO......',
  ];

  // Frame 2: Breathing up / Ki pulse (chest rises 1px)
  const adultFrame2 = [
    '........HHHHHHHH........',
    '......HHHHHHHHHHHH......',
    '....HHHHhhhhHHHHHHHH....',
    '...HHHHhhhhhhHHHHHHHH...',
    '..HHHHHhhhhhhHHHHHHHHH..',
    '..HHHHhhSSSSSSssHHHHHH..',
    '...HHhhSWESSSsEWsHHHH...',
    '....HhhSSSSSSssshHHH....',
    '.....HhhSSssSSssHHH.....',
    '.......OOssssOO.........',
    '.....OOBBBBBBBBOO.......',
    '...OOGGBBBBBBBBGGOO.....',
    '..OOGGGGBBBBBBGGGGGO....',
    '..OGGGGGGBBBBGGGGGGO....',
    '..OGGGGGGOBBOGGGGGGO....',
    '..OGGGGGGOOOGGGGGGGO....',
    '...OGGGGGGBBGGGGGGO.....',
    '...OOBBBBBBBBBBBBOO.....',
    '....OBBBBBBBBBBBBO......',
    '....OGGGGGGGGGGGGO......',
    '....OGGGGG..GGGGGO......',
    '....OGGGGG..GGGGGO......',
    '....OGGGGG..GGGGGO......',
    '....OGGGGG..GGGGGO......',
    '....OGGGGG..GGGGGO......',
    '....Obbbbb..bbbbbO......',
    '....Obbbbb..bbbbbO......',
    '...Obbbbbb..bbbbbbO.....',
    '...ObWWWWb..bWWWWbO.....',
    '....OOOOOO..OOOOOO......',
  ];

  // Kid Goku custom sprite (smaller stature with Power Pole & Flying Nimbus)
  if (formId === 'kid') {
    const kidFrame1 = [
      '.........HHHH...........',
      '.......HHHHHHHH.........',
      '.....HHHHHHHHHHHH.......',
      '....HHHHhhSSSSssHH......',
      '...HHHHhhSWESsEWsHH.....',
      '...PHHHhhSSSSssshHH.....',
      '...PH.HhhSSssSsshH......',
      '...P...OOssssOO.........',
      '...P.OOBBBBBBBBOO.......',
      '...POOGGBBBBBBGGOO......',
      '...POGGGGBBBBGGGGO......',
      '...POGGGGOOOOGGGGO......',
      '...POOBBBBBBBBBBOO......',
      '...P..Obbb..bbbbO.......',
      '...P..Obbb..bbbbO.......',
      '...P.OOOOOOOOOOOO.......',
      '....ONNNNNNNNNNNNO......',
      '..ONNNNNNNNNNNNNNNNO....',
      '.ONNNNNNNNNNNNNNNNNNO...',
      'ONNNNNNNNNNNNNNNNNNNNO..',
      '.ONNNNNNNNNNNNNNNNNNO...',
      '..ONNNNNNNNNNNNNNNNO....',
      '....ONNNNNNNNNNNNO......',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ];
    return {
      width: 24,
      height: 30,
      palette,
      frames: [kidFrame1, kidFrame1],
    };
  }

  // SSJ3 Custom Sprite (Long massive golden mane)
  if (formId === 'ssj3') {
    const ssj3Frame1 = [
      '......HHHHHHHHHHHH......',
      '....HHHHHHHHHHHHHHHH....',
      '...HHHHHhhhhhhHHHHHHH...',
      '..HHHHHHhhhhhhHHHHHHHH..',
      '.HHHHHHHHSSSSssHHHHHHHH.',
      '.HHHHHHHHWEssEWHHHHHHHH.',
      '.HHHHHHHHSSSSssHHHHHHHH.',
      '.HHHHHH..OOssOO..HHHHHH.',
      '.HHHH..OOBBBBBOO..HHHHH.',
      '.HHH.OOGGBBBBGGOO..HHHH.',
      '.HHH.OGGGBBBGGGOO..HHHH.',
      '.HH..OGGGOOOGGGO...HHHH.',
      '.HH..OOBBBBBBBOO....HHH.',
      '.HH...OBBBBBBBO.....HHH.',
      '.HH...OGGGGGGGO.....HHH.',
      '.HH...OGGG.GGGO.....HHH.',
      '.HH...OGGG.GGGO.....HHH.',
      '.HH...Obbb.bbbO.....HHH.',
      '.HH...Obbb.bbbO......HH.',
      '.HH...OOOO.OOOO......HH.',
      '.HH..................HH.',
      '.HH..................HH.',
      '..H...................H.',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ];
    return {
      width: 24,
      height: 30,
      palette,
      frames: [ssj3Frame1, ssj3Frame1],
    };
  }

  return {
    width: 24,
    height: 30,
    palette,
    frames: [adultFrame1, adultFrame2],
  };
}

