import type { Image } from './raster.js';
/**
 * Encode an RGBA image as PNG, optionally upscaled by an integer factor with
 * nearest-neighbour sampling so pixel art stays crisp in any viewer.
 */
export declare function encodePng(image: Image, scale?: number): Buffer;
