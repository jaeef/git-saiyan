/**
 * Tiny pixel-art rasterizer.
 *
 * Characters are described as layered parts built from simple primitives
 * (ellipses, tapered capsules, curved spikes, polygons). Each pixel gets a
 * surface normal from its primitive, is lit from the top-left, and is then
 * quantized onto a 4-tone hand-picked ramp. Part borders become 1px lines:
 * near-black on the silhouette, a dark material tone inside the figure. The
 * result reads like hand-shaded sprite art instead of flat fills, and every
 * animation frame stays consistent because it is re-rendered from the rig.
 */

export type Vec = [number, number];
type Normal = [number, number, number];

export interface Ramp {
  /** Highlight, base, shadow, deep shadow. */
  tones: [string, string, string, string];
  /** Inner line color between parts. Defaults to a darkened deep tone. */
  line?: string;
}

export interface Primitive {
  /** Normal at the pixel center, or null when the point is outside. */
  sample(x: number, y: number): Normal | null;
}

export interface Part {
  ramp: Ramp;
  prims: Primitive[];
  /** Shift the quantized tone: negative = lighter, positive = darker. */
  bias?: number;
  /** Skip the 1px border for this part (used for soft inner shapes). */
  noOutline?: boolean;
}

export interface Stroke {
  points: Vec[];
  /** Tone index to paint (0 = highlight .. 3 = deep), or an explicit color. */
  tone?: number;
  color?: string;
}

export const SILHOUETTE = '#0d0912';
const LIGHT: Normal = normalize([-0.55, -0.7, 0.62]);

function normalize([x, y, z]: Normal): Normal {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

function surface(ox: number, oy: number): Normal {
  const lengthSquared = ox * ox + oy * oy;
  if (lengthSquared >= 1) {
    const length = Math.sqrt(lengthSquared);
    return [ox / length, oy / length, 0];
  }
  return [ox, oy, Math.sqrt(1 - lengthSquared)];
}

export function ellipse(cx: number, cy: number, rx: number, ry: number): Primitive {
  return {
    sample(x, y) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny > 1) return null;
      return surface(nx, ny);
    },
  };
}

/** Segment with a radius that tapers from r0 at `a` to r1 at `b`. */
export function capsule(a: Vec, b: Vec, r0: number, r1: number = r0): Primitive {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSquared = dx * dx + dy * dy || 1;
  return {
    sample(x, y) {
      const t = Math.min(1, Math.max(0, ((x - a[0]) * dx + (y - a[1]) * dy) / lengthSquared));
      const px = a[0] + dx * t;
      const py = a[1] + dy * t;
      const radius = r0 + (r1 - r0) * t;
      const ox = x - px;
      const oy = y - py;
      if (ox * ox + oy * oy > radius * radius) return null;
      return surface(ox / radius, oy / radius);
    },
  };
}

/**
 * Curved, tapering spike: a quadratic curve from `base` to `tip`, bent
 * sideways by `bend` pixels, `width` wide at the root and sharp at the tip.
 */
export function spike(base: Vec, tip: Vec, width: number, bend = 0, sharpness = 0.9): Primitive {
  const mx = (base[0] + tip[0]) / 2;
  const my = (base[1] + tip[1]) / 2;
  const ax = tip[0] - base[0];
  const ay = tip[1] - base[1];
  const axisLength = Math.hypot(ax, ay) || 1;
  const control: Vec = [mx + (-ay / axisLength) * bend, my + (ax / axisLength) * bend];
  const steps = 24;
  const points: Vec[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    points.push([
      u * u * base[0] + 2 * u * t * control[0] + t * t * tip[0],
      u * u * base[1] + 2 * u * t * control[1] + t * t * tip[1],
    ]);
  }
  const minX = Math.min(...points.map((p) => p[0])) - width;
  const maxX = Math.max(...points.map((p) => p[0])) + width;
  const minY = Math.min(...points.map((p) => p[1])) - width;
  const maxY = Math.max(...points.map((p) => p[1])) + width;

  return {
    sample(x, y) {
      if (x < minX || x > maxX || y < minY || y > maxY) return null;
      let best = Infinity;
      let bestIndex = 0;
      for (let i = 0; i <= steps; i++) {
        const distance = (x - points[i][0]) ** 2 + (y - points[i][1]) ** 2;
        if (distance < best) {
          best = distance;
          bestIndex = i;
        }
      }
      const t = bestIndex / steps;
      const half = (width / 2) * Math.pow(1 - t, sharpness);
      if (half < 0.3 || best > half * half) return null;
      const [px, py] = points[bestIndex];
      return surface((x - px) / half, (y - py) / half);
    },
  };
}

/** Filled polygon shaded as if it were a dome centered on `center`. */
export function polygon(points: Vec[], center: Vec, rx: number, ry: number): Primitive {
  return {
    sample(x, y) {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i];
        const [xj, yj] = points[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (!inside) return null;
      return surface(((x - center[0]) / rx) * 0.9, ((y - center[1]) / ry) * 0.9);
    },
  };
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0'))
    .join('')}`;
}

export function mix(a: string, b: string, amount: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * amount, ag + (bg - ag) * amount, ab + (bb - ab) * amount);
}

export function tintRamp(ramp: Ramp, color: string, amount: number): Ramp {
  return {
    tones: ramp.tones.map((tone) => mix(tone, color, amount)) as Ramp['tones'],
    line: ramp.line ? mix(ramp.line, color, amount * 0.6) : undefined,
  };
}

/** RGBA image with straight (non-premultiplied) alpha. */
export interface Image {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export function createImage(width: number, height: number): Image {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

/** Alpha-composite one pixel over the image. */
export function blendPixel(image: Image, x: number, y: number, color: string, alpha = 1): void {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height || alpha <= 0) return;
  const [r, g, b] = hexToRgb(color);
  const index = (y * image.width + x) * 4;
  const dstAlpha = image.data[index + 3] / 255;
  const outAlpha = alpha + dstAlpha * (1 - alpha);
  if (outAlpha <= 0) return;
  const blend = (src: number, dst: number) => (src * alpha + dst * dstAlpha * (1 - alpha)) / outAlpha;
  image.data[index] = blend(r, image.data[index]);
  image.data[index + 1] = blend(g, image.data[index + 1]);
  image.data[index + 2] = blend(b, image.data[index + 2]);
  image.data[index + 3] = outAlpha * 255;
}

export function drawImage(target: Image, source: Image, offsetX = 0, offsetY = 0): void {
  for (let y = 0; y < source.height; y++) {
    for (let x = 0; x < source.width; x++) {
      const index = (y * source.width + x) * 4;
      const alpha = source.data[index + 3] / 255;
      if (alpha <= 0) continue;
      blendPixel(
        target,
        x + offsetX,
        y + offsetY,
        rgbToHex(source.data[index], source.data[index + 1], source.data[index + 2]),
        alpha
      );
    }
  }
}

/** Opaque-pixel mask of an image. */
export function alphaMask(image: Image, threshold = 200): Uint8Array {
  const mask = new Uint8Array(image.width * image.height);
  for (let i = 0; i < mask.length; i++) mask[i] = image.data[i * 4 + 3] >= threshold ? 1 : 0;
  return mask;
}

/**
 * Rasterize parts back-to-front, shade them, and draw part borders.
 * `overlay` pixels (eyes, mouth, symbols) are painted last, unshaded.
 */
export function rasterize(
  width: number,
  height: number,
  parts: Part[],
  strokes: Stroke[] = [],
  overlay: { x: number; y: number; color: string }[] = []
): Image {
  const size = width * height;
  const owner = new Int16Array(size).fill(-1);
  const tone = new Uint8Array(size);
  const edge = new Uint8Array(size);

  parts.forEach((part, partIndex) => {
    const inside = new Uint8Array(size);
    const toneHere = new Uint8Array(size);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let best: Normal | null = null;
        for (const prim of part.prims) {
          const normal = prim.sample(x + 0.5, y + 0.5);
          if (normal && (!best || normal[2] > best[2])) best = normal;
        }
        if (!best) continue;
        const index = y * width + x;
        inside[index] = 1;
        const lit = Math.max(0, best[0] * LIGHT[0] + best[1] * LIGHT[1] + best[2] * LIGHT[2]);
        let level = lit > 0.86 ? 0 : lit > 0.6 ? 1 : lit > 0.3 ? 2 : 3;
        level = Math.min(3, Math.max(0, level + (part.bias ?? 0)));
        toneHere[index] = level;
      }
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        if (!inside[index]) continue;
        owner[index] = partIndex;
        tone[index] = toneHere[index];
        const isBorder =
          x === 0 ||
          y === 0 ||
          x === width - 1 ||
          y === height - 1 ||
          !inside[index - 1] ||
          !inside[index + 1] ||
          !inside[index - width] ||
          !inside[index + width];
        edge[index] = isBorder && !part.noOutline ? 1 : 0;
      }
    }
  });

  const colors: (string | null)[] = new Array(size).fill(null);
  for (let index = 0; index < size; index++) {
    const partIndex = owner[index];
    if (partIndex < 0) continue;
    colors[index] = parts[partIndex].ramp.tones[tone[index]];
  }

  for (const stroke of strokes) {
    for (let i = 0; i < stroke.points.length - 1; i++) {
      forLine(stroke.points[i], stroke.points[i + 1], (x, y) => {
        const index = y * width + x;
        if (x < 0 || y < 0 || x >= width || y >= height || owner[index] < 0 || edge[index]) return;
        colors[index] = stroke.color ?? parts[owner[index]].ramp.tones[stroke.tone ?? 2];
      });
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (!edge[index] || owner[index] < 0) continue;
      const touchesEmpty =
        x === 0 ||
        y === 0 ||
        x === width - 1 ||
        y === height - 1 ||
        owner[index - 1] < 0 ||
        owner[index + 1] < 0 ||
        owner[index - width] < 0 ||
        owner[index + width] < 0;
      const ramp = parts[owner[index]].ramp;
      colors[index] = touchesEmpty ? SILHOUETTE : ramp.line ?? mix(ramp.tones[3], SILHOUETTE, 0.45);
    }
  }

  for (const pixel of overlay) {
    const x = Math.round(pixel.x);
    const y = Math.round(pixel.y);
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    colors[y * width + x] = pixel.color;
  }

  const image = createImage(width, height);
  for (let index = 0; index < size; index++) {
    const color = colors[index];
    if (!color) continue;
    const [r, g, b] = hexToRgb(color);
    image.data[index * 4] = r;
    image.data[index * 4 + 1] = g;
    image.data[index * 4 + 2] = b;
    image.data[index * 4 + 3] = 255;
  }
  return image;
}

/** Bresenham line between two points (rounded to pixels). */
export function forLine(a: Vec, b: Vec, visit: (x: number, y: number) => void): void {
  let x0 = Math.round(a[0]);
  let y0 = Math.round(a[1]);
  const x1 = Math.round(b[0]);
  const y1 = Math.round(b[1]);
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;
  for (;;) {
    visit(x0, y0);
    if (x0 === x1 && y0 === y1) break;
    const doubled = 2 * error;
    if (doubled >= dy) {
      error += dy;
      x0 += sx;
    }
    if (doubled <= dx) {
      error += dx;
      y0 += sy;
    }
  }
}
