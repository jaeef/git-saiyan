import { deflateSync } from 'node:zlib';
import type { Image } from './raster.js';

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(data.length, 0);
  header.write(type, 4, 'ascii');
  const body = Buffer.concat([header.subarray(4), Buffer.from(data)]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([header.subarray(0, 4), body, crc]);
}

/**
 * Encode an RGBA image as PNG, optionally upscaled by an integer factor with
 * nearest-neighbour sampling so pixel art stays crisp in any viewer.
 */
export function encodePng(image: Image, scale = 1): Buffer {
  const factor = Math.max(1, Math.floor(scale));
  const width = image.width * factor;
  const height = image.height * factor;
  const raw = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0; // filter: none
    const sourceY = Math.floor(y / factor);
    for (let x = 0; x < width; x++) {
      const source = (sourceY * image.width + Math.floor(x / factor)) * 4;
      const target = rowStart + 1 + x * 4;
      raw[target] = image.data[source];
      raw[target + 1] = image.data[source + 1];
      raw[target + 2] = image.data[source + 2];
      raw[target + 3] = image.data[source + 3];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', new Uint8Array(0)),
  ]);
}
