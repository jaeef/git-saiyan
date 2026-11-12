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
export declare const SILHOUETTE = "#0d0912";
export declare function ellipse(cx: number, cy: number, rx: number, ry: number): Primitive;
/** Segment with a radius that tapers from r0 at `a` to r1 at `b`. */
export declare function capsule(a: Vec, b: Vec, r0: number, r1?: number): Primitive;
/**
 * Curved, tapering spike: a quadratic curve from `base` to `tip`, bent
 * sideways by `bend` pixels, `width` wide at the root and sharp at the tip.
 */
export declare function spike(base: Vec, tip: Vec, width: number, bend?: number, sharpness?: number): Primitive;
/** Filled polygon shaded as if it were a dome centered on `center`. */
export declare function polygon(points: Vec[], center: Vec, rx: number, ry: number): Primitive;
export declare function hexToRgb(hex: string): [number, number, number];
export declare function rgbToHex(r: number, g: number, b: number): string;
export declare function mix(a: string, b: string, amount: number): string;
export declare function tintRamp(ramp: Ramp, color: string, amount: number): Ramp;
/** RGBA image with straight (non-premultiplied) alpha. */
export interface Image {
    width: number;
    height: number;
    data: Uint8ClampedArray;
}
export declare function createImage(width: number, height: number): Image;
/** Alpha-composite one pixel over the image. */
export declare function blendPixel(image: Image, x: number, y: number, color: string, alpha?: number): void;
export declare function drawImage(target: Image, source: Image, offsetX?: number, offsetY?: number): void;
/** Opaque-pixel mask of an image. */
export declare function alphaMask(image: Image, threshold?: number): Uint8Array;
/**
 * Rasterize parts back-to-front, shade them, and draw part borders.
 * `overlay` pixels (eyes, mouth, symbols) are painted last, unshaded.
 */
export declare function rasterize(width: number, height: number, parts: Part[], strokes?: Stroke[], overlay?: {
    x: number;
    y: number;
    color: string;
}[]): Image;
/** Bresenham line between two points (rounded to pixels). */
export declare function forLine(a: Vec, b: Vec, visit: (x: number, y: number) => void): void;
export {};
