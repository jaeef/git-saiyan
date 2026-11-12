/**
 * Goku character rig (unofficial fan art).
 *
 * One parametric ki-charge pose (fists clenched at the hips, wide stance)
 * built from shaded primitives. Each form swaps the hair sculpt, palette,
 * eyes and outfit; each animation frame re-renders the rig with the hair,
 * sash and breathing moved slightly, so frames stay consistent.
 */
import {
  capsule,
  ellipse,
  polygon,
  rasterize,
  spike,
  tintRamp,
  type Image,
  type Part,
  type Primitive,
  type Ramp,
  type Stroke,
  type Vec,
} from './raster.js';

export const CANVAS_WIDTH = 128;
export const CANVAS_HEIGHT = 120;
/** Canvas row the feet stand on. */
export const GROUND = 110;
/** Vertical room above the hair for rising aura flames. */
const Y = 20;
const CX = CANVAS_WIDTH / 2;

const ramp = (hi: string, base: string, shadow: string, deep: string, line?: string): Ramp => ({
  tones: [hi, base, shadow, deep],
  line,
});

// Hand-picked ramps: shadows shift toward purple/red, highlights toward warm.
const SKIN = ramp('#ffe4c8', '#f5bd8e', '#d48862', '#9a5340', '#5e2a28');
const GI = ramp('#ffb956', '#f5821e', '#c95512', '#842f12', '#4d1a10');
const BLUE = ramp('#5f8cf0', '#2f56cc', '#203693', '#151d5c', '#0e1238');
const BOOT = ramp('#4d74dc', '#2a47ab', '#1c2d76', '#121a49', '#0b0f2c');
const FUR = ramp('#ff7f6e', '#d9323d', '#9f1b33', '#5f0f24', '#3a0818');
const TAIL = ramp('#b9774b', '#8a4f2f', '#5f3220', '#3b1e15');
const GOLD_BELT = ramp('#fff1a8', '#f2c94c', '#c48a1c', '#7d5310');
const POLE = ramp('#ff8a7a', '#e2352f', '#a51d2a', '#64101d');
const NIMBUS = ramp('#fffbe0', '#ffe78a', '#f2b93b', '#c27c1c', '#7a4a10');

const HAIR = {
  black: ramp('#56567a', '#2b2b45', '#18182d', '#0e0e1c', '#08080f'),
  gold: ramp('#fffcc4', '#ffe356', '#f0ad1f', '#b06a10', '#6b3b08'),
  paleGold: ramp('#ffffdc', '#fff08a', '#f6c33c', '#c07f16', '#6b4209'),
  crimson: ramp('#ff9cb0', '#ff4a6e', '#c8204f', '#7c1035', '#4a0820'),
  blue: ramp('#c4f6ff', '#55d8ff', '#2299d8', '#165c9c', '#0b3360'),
  silver: ramp('#ffffff', '#e2e6f4', '#aab1d2', '#6d739c', '#3c4066'),
};

type HairStyle = 'base' | 'ssj1' | 'ssj2' | 'ssj3' | 'ssj4' | 'god' | 'ui';
type Build = 'adult' | 'slim' | 'kid';

interface FormStyle {
  hair: HairStyle;
  hairRamp: Ramp;
  iris: string;
  brows: boolean;
  outfit: 'gi' | 'fur';
  build: Build;
  tint?: { color: string; amount: number };
  tail?: boolean;
  pole?: boolean;
  nimbus?: boolean;
  eyeRing?: string;
}

const FORM_STYLES: Record<string, FormStyle> = {
  kid: { hair: 'base', hairRamp: HAIR.black, iris: '#1a1426', brows: true, outfit: 'gi', build: 'kid', tail: true, pole: true, nimbus: true },
  base: { hair: 'base', hairRamp: HAIR.black, iris: '#1a1426', brows: true, outfit: 'gi', build: 'adult' },
  kaioken: { hair: 'base', hairRamp: HAIR.black, iris: '#1a1426', brows: true, outfit: 'gi', build: 'adult', tint: { color: '#ff1f2d', amount: 0.32 } },
  ssj1: { hair: 'ssj1', hairRamp: HAIR.gold, iris: '#1f9e8f', brows: true, outfit: 'gi', build: 'adult' },
  ssj2: { hair: 'ssj2', hairRamp: HAIR.paleGold, iris: '#1f9e8f', brows: true, outfit: 'gi', build: 'adult' },
  ssj3: { hair: 'ssj3', hairRamp: HAIR.gold, iris: '#1f9e8f', brows: false, outfit: 'gi', build: 'adult' },
  ssj4: { hair: 'ssj4', hairRamp: HAIR.black, iris: '#f4b938', brows: true, outfit: 'fur', build: 'adult', tail: true, eyeRing: '#c3262f' },
  ssjg: { hair: 'god', hairRamp: HAIR.crimson, iris: '#d3203b', brows: true, outfit: 'gi', build: 'slim' },
  ssjb: { hair: 'ssj1', hairRamp: HAIR.blue, iris: '#1aa9d6', brows: true, outfit: 'gi', build: 'adult' },
  mui: { hair: 'ui', hairRamp: HAIR.silver, iris: '#c9cdf2', brows: true, outfit: 'gi', build: 'adult' },
};

interface Anchors {
  cx: number;
  head: Vec;
  headR: Vec;
  shoulderY: number;
  shoulderHalf: number;
  waistY: number;
  waistHalf: number;
  footY: number;
  stance: number;
  armR: number;
  /** Uniform size factor for limbs and details. */
  k: number;
  hairScale: number;
}

function anchorsFor(build: Build): Anchors {
  if (build === 'kid') {
    return {
      cx: CX, head: [CX, 50 + Y], headR: [7.8, 8.2], shoulderY: 60 + Y, shoulderHalf: 11.5,
      waistY: 73 + Y, waistHalf: 8, footY: 87 + Y, stance: 7.5, armR: 3, k: 0.78, hairScale: 0.98,
    };
  }
  const slim = build === 'slim';
  return {
    cx: CX, head: [CX, 38 + Y], headR: [7.4, 7.8], shoulderY: 49 + Y, shoulderHalf: slim ? 13.5 : 15,
    waistY: 66 + Y, waistHalf: slim ? 9 : 10, footY: 90 + Y, stance: 11, armR: slim ? 3.1 : 3.6,
    k: 1, hairScale: 1.16,
  };
}

interface SpikeSpec {
  base: Vec;
  tip: Vec;
  width: number;
  bend?: number;
}

const s = (bx: number, by: number, tx: number, ty: number, width: number, bend = 0): SpikeSpec => ({
  base: [bx, by],
  tip: [tx, ty],
  width: width * 1.2,
  bend,
});

interface HairSculpt {
  mass: { center: Vec; radius: Vec };
  front: SpikeSpec[];
  bangs: SpikeSpec[];
  back: SpikeSpec[];
  /** Animation amplitude for tip flutter. */
  flutter: number;
}

/** Hair sculpts, as offsets from the head center. */
function hairSculpt(style: HairStyle): HairSculpt {
  const base: HairSculpt = {
    mass: { center: [0, -8], radius: [9, 5.2] },
    front: [
      s(-5, -9, -12, -22, 7, -1),
      s(0, -10, 1, -24, 7, 1),
      s(5, -9, 13, -21, 7, 1),
      s(-7, -7, -20, -12, 7, -2),
      s(-7, -4, -18, -1, 6, 2),
      s(7, -7, 20, -13, 7, 2),
      s(7, -4, 18, -2, 6, -2),
      s(-6, -2, -15, 5, 5, 1),
      s(-2, -10, -8, -25, 6, -1),
    ],
    bangs: [s(-3, -6, -8, -0.5, 5, 1), s(1, -6, -1, -1, 4), s(4, -6, 7, -0.5, 4, -1)],
    back: [],
    flutter: 0.5,
  };

  switch (style) {
    case 'ssj1':
      return {
        mass: { center: [0, -8], radius: [9.5, 5.4] },
        front: [
          s(-6, -8, -17, -20, 8, -2),
          s(-3, -10, -9, -27, 8, -1),
          s(0, -10, 0, -30, 8),
          s(3, -10, 9, -27, 8, 1),
          s(6, -8, 17, -20, 8, 2),
          s(-7, -5, -17, -9, 6, -1),
          s(7, -5, 17, -9, 6, 1),
        ],
        bangs: [s(-2, -6, -5, 0, 4, 1), s(2, -6, 4, -1.5, 3.5)],
        back: [],
        flutter: 0.9,
      };
    case 'ssj2':
      return {
        mass: { center: [0, -8], radius: [9.5, 5.4] },
        front: [
          s(-6, -8, -19, -22, 6.5, -2),
          s(-3, -10, -10, -29, 6.5, -1),
          s(0, -10, 0, -32, 6.5),
          s(3, -10, 10, -29, 6.5, 1),
          s(6, -8, 19, -22, 6.5, 2),
          s(-7, -5, -19, -10, 5, -1),
          s(7, -5, 19, -10, 5, 1),
        ],
        bangs: [s(-1, -6, -3, 2.5, 2.6, 1)],
        back: [],
        flutter: 1,
      };
    case 'ssj3':
      return {
        mass: { center: [0, -8], radius: [9.5, 5.6] },
        front: [
          s(-4, -9, -11, -20, 8, -1),
          s(0, -10, 0, -22, 8),
          s(4, -9, 11, -20, 8, 1),
          s(-7, -6, -15, -8, 6, -1),
          s(7, -6, 15, -8, 6, 1),
        ],
        bangs: [s(-3, -6, -6, 1, 4, 1), s(3, -6, 6, 1, 4, -1)],
        back: [
          s(-9, -3, -26, 30, 11, -3),
          s(-6, -5, -21, 44, 13, -3),
          s(-2, -5, -10, 50, 13, -1),
          s(2, -5, 10, 50, 13, 1),
          s(6, -5, 21, 44, 13, 3),
          s(9, -3, 26, 30, 11, 3),
        ],
        flutter: 1.1,
      };
    case 'ssj4':
      return {
        mass: { center: [0, -8], radius: [9.5, 5.4] },
        front: [
          s(-5, -9, -14, -20, 7, -1),
          s(0, -10, -1, -22, 7, -1),
          s(5, -9, 14, -19, 7, 1),
          s(-7, -6, -19, -8, 6, -2),
          s(7, -6, 19, -8, 6, 2),
        ],
        bangs: [s(-3, -6, -6, 1, 4, 1), s(2, -6, 4, 3.5, 3, -1)],
        back: [
          s(-7, -4, -16, 20, 10, -2),
          s(-2, -5, -5, 26, 10, -1),
          s(2, -5, 5, 26, 10, 1),
          s(7, -4, 16, 20, 10, 2),
        ],
        flutter: 0.8,
      };
    case 'god':
      return {
        ...base,
        front: base.front.map((spec) => ({ ...spec, width: spec.width - 1, tip: [spec.tip[0] * 0.92, spec.tip[1] + 1] as Vec })),
        bangs: [s(-3, -6, -7, -0.5, 4.5, 1), s(3, -6, 6, -1, 3.5, -1)],
        flutter: 0.6,
      };
    case 'ui':
      return {
        ...base,
        front: base.front.map((spec) => ({ ...spec, tip: [spec.tip[0] * 0.95, spec.tip[1] - 4] as Vec })),
        bangs: [s(-3, -6, -7, -2, 4.5, 1), s(3, -6, 6, -2.5, 3.5, -1)],
        flutter: 0.7,
      };
    default:
      return base;
  }
}

function hairPrims(specs: SpikeSpec[], head: Vec, scale: number, t: number, flutter: number, seed: number): Primitive[] {
  return specs.map((spec, index) => {
    const phase = Math.PI * 2 * t + (index + seed) * 1.9;
    const wobbleX = Math.sin(phase) * flutter;
    const wobbleY = -Math.abs(Math.cos(phase * 0.5)) * flutter * 0.8;
    const base: Vec = [head[0] + spec.base[0] * scale, head[1] + spec.base[1] * scale];
    const tip: Vec = [head[0] + spec.tip[0] * scale + wobbleX, head[1] + spec.tip[1] * scale + wobbleY];
    return spike(base, tip, spec.width * scale, (spec.bend ?? 0) * scale);
  });
}

function mirror(cx: number, [x, y]: Vec): Vec {
  return [2 * cx - x, y];
}


/**
 * Render one animation frame (t in [0, 1)) of a Goku form. Feet rest on
 * GROUND (Kid Goku: on the cloud), centered horizontally. `stage` (0-2) is the
 * power-up stage, which brightens the hair.
 */
export function renderGokuFrame(formId: string, t: number, stage = 0): Image {
  const style = FORM_STYLES[formId] ?? FORM_STYLES.base;
  const a = anchorsFor(style.build);
  const { cx, k } = a;
  const tint = (r: Ramp) => (style.tint ? tintRamp(r, style.tint.color, style.tint.amount) : r);
  const skin = tint(SKIN);
  const gi = tint(GI);
  const blue = tint(BLUE);
  // Power-up stages brighten coloured hair toward white; dark hair gets a
  // cool sheen instead so it never turns grey.
  const hairGlow = style.hairRamp === HAIR.black ? tintRamp(style.hairRamp, '#7c8cff', 0.12 * stage) : tintRamp(style.hairRamp, '#ffffff', 0.13 * stage);
  const hairRamp = tint(hairGlow);
  const sleeveRamp = style.outfit === 'fur' ? FUR : blue;
  const armRamp = style.outfit === 'fur' ? FUR : skin;
  const pantsRamp = style.outfit === 'fur' ? blue : gi;
  const beltRamp = style.outfit === 'fur' ? GOLD_BELT : blue;

  // Breathing: the upper body rises one pixel for half the loop.
  const breath = Math.round(0.5 - 0.5 * Math.cos(Math.PI * 2 * t));
  const nimbusBob = style.nimbus ? Math.round(Math.sin(Math.PI * 2 * t) * 0.8) : 0;
  const up = (y: number) => y - breath + nimbusBob;
  const low = (y: number) => y + nimbusBob;

  const head: Vec = [a.head[0], up(a.head[1])];
  const sY = up(a.shoulderY);
  const wY = up(a.waistY);
  const fY = low(a.footY);
  const sh = a.shoulderHalf;
  const wh = a.waistHalf;
  const legScale = (a.footY - a.waistY) / 24;
  const sculpt = hairSculpt(style.hair);
  const hs = a.hairScale;

  const back: Part[] = [];
  const parts: Part[] = [];
  const strokes: Stroke[] = [];
  const overlay: { x: number; y: number; color: string }[] = [];

  // --- Back layer: long mane, tail, power pole ---------------------------
  if (sculpt.back.length > 0) {
    back.push({ ramp: hairRamp, prims: hairPrims(sculpt.back, head, hs, t, sculpt.flutter, 3), bias: 1 });
  }
  if (style.pole) {
    // Carried across the back: the top end shows above the left shoulder.
    back.push({ ramp: POLE, prims: [capsule([cx + 12 * k, sY + 17 * k], [cx - 17 * k, sY - 7 * k], 1.5)] });
  }
  if (style.tail) {
    const swing = Math.sin(Math.PI * 2 * t) * 2;
    const root: Vec = [cx + wh - 2, wY + 3 * k];
    const mid: Vec = [cx + wh + 7 * k, wY + 1 * k + swing * 0.5];
    const tip: Vec = [cx + wh + 11 * k + swing * 0.4, wY - 8 * k + swing];
    back.push({ ramp: style.outfit === 'fur' ? FUR : TAIL, prims: [capsule(root, mid, 2 * k + 0.4), capsule(mid, tip, 2 * k + 0.4, 1.4)] });
  }

  // --- Legs and boots ------------------------------------------------------
  const leg = (side: 1 | -1) => {
    const flip = (point: Vec): Vec => (side === 1 ? point : mirror(cx, point));
    const ly = (dy: number) => wY + breath + dy * legScale; // legs do not breathe
    const footX = cx - a.stance;
    const pts: Vec[] = [
      [cx - wh - 1, ly(2)],
      [cx + 1, ly(2)],
      [cx, ly(7)],
      [cx - 3 * k, ly(13)],
      [footX + 6 * k, fY - 6 * k],
      [footX - 3.5 * k, fY - 6 * k],
      [footX - 6.5 * k, ly(11)],
      [cx - wh - 4 * k, ly(5)],
    ].map((point) => flip(point as Vec));
    const center = flip([footX + 1, ly(11)]);
    parts.push({ ramp: pantsRamp, prims: [polygon(pts, center, 8 * k, 11 * k)] });
    strokes.push({ points: [flip([footX - 2 * k, ly(8)]), flip([footX, ly(14)])], tone: 2 });
    strokes.push({ points: [flip([cx - 4 * k, ly(10)]), flip([footX + 3 * k, ly(16)])], tone: 2 });

    const boot: Vec[] = [
      [footX - 4.5 * k, fY - 7 * k],
      [footX + 4.5 * k, fY - 7 * k],
      [footX + 4.5 * k, fY - 3 * k],
      [footX + 7 * k, fY],
      [footX - 5.5 * k, fY],
      [footX - 5 * k, fY - 3 * k],
    ].map((point) => flip(point as Vec));
    parts.push({ ramp: tint(BOOT), prims: [polygon(boot, flip([footX - 1, fY - 5 * k]), 6 * k, 6 * k)] });
    parts.push({
      ramp: tint(BOOT),
      prims: [capsule(flip([footX - 4 * k, fY - 7 * k]), flip([footX + 4 * k, fY - 7 * k]), 1.3 * k + 0.2)],
      bias: -1,
    });
  };
  leg(1);
  leg(-1);

  // --- Torso --------------------------------------------------------------
  const torso: Vec[] = [
    [cx - sh, sY - 1],
    [cx + sh, sY - 1],
    [cx + sh - 1, sY + 7 * k],
    [cx + wh + 1, wY],
    [cx - wh - 1, wY],
    [cx - sh + 1, sY + 7 * k],
  ];
  const neckTop: Vec = [cx, head[1] + 4 * k];
  parts.push({ ramp: skin, prims: [capsule(neckTop, [cx, sY + 1], 4 * k + 0.4)], bias: 1 });
  if (style.outfit === 'fur') {
    parts.push({ ramp: FUR, prims: [polygon(torso, [cx, sY + 6], sh, 12)] });
    const chest: Vec[] = [
      [cx - 8, sY + 1],
      [cx + 8, sY + 1],
      [cx + 6, wY - 1],
      [cx - 6, wY - 1],
    ];
    parts.push({ ramp: skin, prims: [polygon(chest, [cx - 1, sY + 7], 9, 12)] });
    strokes.push({ points: [[cx - 6, sY + 7], [cx - 1, sY + 8]], tone: 2 });
    strokes.push({ points: [[cx + 1, sY + 8], [cx + 6, sY + 7]], tone: 2 });
    strokes.push({ points: [[cx, sY + 9], [cx, wY - 2]], tone: 2 });
    strokes.push({ points: [[cx - 3, sY + 12], [cx + 3, sY + 12]], tone: 2 });
  } else {
    parts.push({ ramp: gi, prims: [polygon(torso, [cx, sY + 6], sh, 12 * k)] });
    const collar = 5 * (sh / 15);
    parts.push({ ramp: blue, prims: [polygon([[cx - collar, sY - 1], [cx + collar, sY - 1], [cx, sY + 8 * k]], [cx, sY], 6, 8)] });
    strokes.push({ points: [[cx - sh + 5, sY + 9 * k], [cx - 2, sY + 11 * k]], tone: 2 });
    strokes.push({ points: [[cx + 2, sY + 11 * k], [cx + sh - 5, sY + 9 * k]], tone: 2 });
  }

  // Belt and sash tails.
  parts.push({
    ramp: beltRamp,
    prims: [polygon([[cx - wh - 1, wY - 1], [cx + wh + 1, wY - 1], [cx + wh + 1.5, wY + 3 * k], [cx - wh - 1.5, wY + 3 * k]], [cx, wY], wh + 2, 3)],
  });
  const sway = Math.sin(Math.PI * 2 * t + 0.6) * 1.5;
  parts.push({
    ramp: beltRamp,
    prims: [
      capsule([cx - wh + 1, wY + 2], [cx - wh - 1 + sway, wY + 10 * k], 1.6 * k + 0.2, 1),
      capsule([cx - wh + 3, wY + 2], [cx - wh + 2.5 + sway * 1.3, wY + 9 * k], 1.5 * k + 0.2, 0.9),
    ],
  });

  // --- Arms (ki-charge pose: fists clenched beside the hips) ---------------
  const arm = (side: 1 | -1) => {
    const flip = (point: Vec): Vec => (side === 1 ? point : mirror(cx, point));
    const shoulder: Vec = flip([cx - sh + 1, sY + 2]);
    const elbow: Vec = flip([cx - sh - 4.5 * k, sY + 12 * k]);
    const wrist: Vec = flip([cx - sh - 1.5 * k, sY + 20 * k]);
    const fist: Vec = flip([cx - sh - 0.8 * k, sY + 22.6 * k]);
    const band: Vec = [elbow[0] + (wrist[0] - elbow[0]) * 0.62, elbow[1] + (wrist[1] - elbow[1]) * 0.62];
    parts.push({ ramp: armRamp, prims: [capsule(shoulder, elbow, a.armR + 0.3, a.armR), capsule(elbow, wrist, a.armR - 0.1, a.armR - 0.5)] });
    const sleeveEnd: Vec = [shoulder[0] + (elbow[0] - shoulder[0]) * 0.38, shoulder[1] + (elbow[1] - shoulder[1]) * 0.38];
    parts.push({ ramp: sleeveRamp, prims: [capsule([shoulder[0] + side * 0.5, shoulder[1] - 0.5], sleeveEnd, a.armR + 0.9, a.armR + 0.4)] });
    parts.push({ ramp: style.outfit === 'fur' ? ramp('#ffffff', '#e8ecf4', '#b7bfd4', '#7f88a6') : blue, prims: [capsule(band, wrist, a.armR + 0.1)] });
    // Clenched fist: knuckle block, thumb wrapped across toward the body,
    // a knuckle line and a finger crease.
    const fistRx = 3.4 * k + 0.3;
    const fistRy = 3.1 * k + 0.3;
    const thumbSide = fist[0] < cx ? 1 : -1;
    parts.push({
      ramp: skin,
      prims: [
        ellipse(fist[0], fist[1], fistRx, fistRy),
        ellipse(fist[0] + thumbSide * fistRx * 0.5, fist[1] + fistRy * 0.5, fistRx * 0.55, fistRy * 0.45),
      ],
    });
    const knuckleY = Math.round(fist[1] - fistRy * 0.2);
    strokes.push({ points: [[fist[0] - fistRx + 1, knuckleY], [fist[0] + fistRx - 1, knuckleY]], tone: 2 });
    strokes.push({ points: [[Math.round(fist[0] - thumbSide), knuckleY + 1], [Math.round(fist[0] - thumbSide), knuckleY + 2]], tone: 3 });
  };
  arm(1);
  arm(-1);

  // --- Head ---------------------------------------------------------------
  const [hx, hy] = head;
  const earR: Vec = [1.7 * k + 0.4, 2.4 * k + 0.4];
  parts.push({ ramp: skin, prims: [ellipse(hx - a.headR[0] - 0.3, hy + 1, earR[0], earR[1]), ellipse(hx + a.headR[0] + 0.3, hy + 1, earR[0], earR[1])], bias: 1 });
  parts.push({ ramp: skin, prims: [ellipse(hx, hy - 0.5, a.headR[0], a.headR[1]), ellipse(hx, hy + 4.5 * k, a.headR[0] * 0.78, 5 * k)] });

  // --- Hair (front) ---------------------------------------------------------
  const hairFront: Primitive[] = [
    ellipse(hx + sculpt.mass.center[0] * hs, hy + sculpt.mass.center[1] * hs, sculpt.mass.radius[0] * hs, sculpt.mass.radius[1] * hs),
    ...hairPrims(sculpt.front, head, hs, t, sculpt.flutter, 0),
    // Kid bangs stop above the eyes so the big eyes stay readable.
    ...hairPrims(
      style.build === 'kid' ? sculpt.bangs.map((spec) => ({ ...spec, tip: [spec.tip[0], spec.tip[1] - 3] as Vec })) : sculpt.bangs,
      head,
      hs,
      t,
      sculpt.flutter * 0.4,
      7
    ),
  ];
  parts.push({ ramp: hairRamp, prims: hairFront });

  // --- Nimbus (kid) -------------------------------------------------------------
  if (style.nimbus) {
    const cloudY = fY + 2;
    parts.push({
      ramp: NIMBUS,
      prims: [
        ellipse(cx - 12, cloudY + 1, 7, 4),
        ellipse(cx - 3, cloudY - 1, 8, 4.6),
        ellipse(cx + 7, cloudY, 8, 4.4),
        ellipse(cx + 16, cloudY + 2, 6, 3.4),
        ellipse(cx - 20, cloudY + 3, 4.5, 2.6),
      ],
    });
  }

  // --- Face overlay ---------------------------------------------------------
  const fx = Math.round(hx);
  const fy = Math.round(hy);
  const lash = style.eyeRing ?? '#2a1418';
  const browColor = style.hair === 'base' || style.hair === 'god' || style.hair === 'ssj4' ? hairRamp.tones[3] : hairRamp.tones[2];
  const dot = (dx: number, dy: number, color: string) => {
    overlay.push({ x: fx + dx, y: fy + dy, color });
    overlay.push({ x: fx - dx - 1, y: fy + dy, color });
  };
  const lipLine = '#5e2a28';
  if (style.build === 'kid') {
    // Kid: big round eyes with a highlight and a short determined brow.
    if (style.brows) for (const [dx, dy] of [[-6, -3], [-5, -3], [-4, -3], [-3, -2]] as Vec[]) dot(dx, dy, browColor);
    for (const dx of [-6, -5, -4, -3]) dot(dx, -1, lash);
    dot(-6, 0, '#ffffff');
    dot(-5, 0, '#ffffff');
    dot(-4, 0, style.iris);
    dot(-3, 0, style.iris);
    dot(-6, 1, lash);
    dot(-5, 1, style.iris);
    dot(-4, 1, style.iris);
    dot(-3, 1, '#ffffff');
    dot(-5, 2, skin.tones[2]);
    dot(-4, 2, skin.tones[2]);
    overlay.push({ x: fx - 1, y: fy + 3, color: skin.tones[2] });
    overlay.push({ x: fx, y: fy + 4, color: skin.tones[3] });
    overlay.push({ x: fx - 2, y: fy + 6, color: lipLine });
    overlay.push({ x: fx - 1, y: fy + 6, color: lipLine });
    overlay.push({ x: fx, y: fy + 6, color: lipLine });
    overlay.push({ x: fx + 1, y: fy + 6, color: lipLine });
    overlay.push({ x: fx - 1, y: fy + 7, color: skin.tones[2] });
    overlay.push({ x: fx, y: fy + 7, color: skin.tones[2] });
  } else {
    // Adult: thick brows angled down to the center, narrowed two-tone eyes.
    const browPixels: Vec[] = [[-6, -3], [-5, -3], [-5, -2], [-4, -2], [-3, -2], [-3, -1], [-2, -1]];
    for (const [dx, dy] of browPixels) dot(dx, dy, style.brows ? browColor : skin.tones[3]);
    if (!style.brows) dot(-4, -2, skin.tones[2]);
    for (const dx of [-5, -4, -3, -2]) dot(dx, 0, lash);
    dot(-5, 1, '#ffffff');
    dot(-4, 1, '#ffffff');
    dot(-3, 1, style.iris);
    dot(-2, 1, lash);
    dot(-4, 2, skin.tones[2]);
    dot(-3, 2, skin.tones[2]);
    if (style.eyeRing) {
      dot(-6, 0, style.eyeRing);
      dot(-6, 1, style.eyeRing);
      dot(-5, 2, style.eyeRing);
    }
    // Brow furrow, nose and a set jaw.
    overlay.push({ x: fx - 1, y: fy - 1, color: skin.tones[2] });
    overlay.push({ x: fx, y: fy - 1, color: skin.tones[2] });
    overlay.push({ x: fx - 1, y: fy + 3, color: skin.tones[2] });
    overlay.push({ x: fx, y: fy + 3, color: skin.tones[3] });
    overlay.push({ x: fx, y: fy + 4, color: skin.tones[3] });
    for (const dx of [-2, -1, 0, 1]) overlay.push({ x: fx + dx, y: fy + 6, color: lipLine });
    overlay.push({ x: fx - 1, y: fy + 7, color: skin.tones[2] });
    overlay.push({ x: fx, y: fy + 7, color: skin.tones[2] });
    dot(-4, 4, skin.tones[2]);
  }

  return rasterize(CANVAS_WIDTH, CANVAS_HEIGHT, [...back, ...parts], strokes, overlay);
}
