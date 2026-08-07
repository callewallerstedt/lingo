#!/usr/bin/env node
/**
 * Renders the Swedish flag app icons as PNGs.
 *
 * Written against zlib directly rather than pulling in sharp or canvas: the
 * artwork is flat rectangles, so a hand-rolled encoder is a few dozen lines and
 * keeps the dependency tree clean.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = join(ROOT, "public");

// Official-ish Swedish flag colours.
const BLUE = [0x00, 0x6a, 0xa7];
const YELLOW = [0xfe, 0xcc, 0x00];

/** CRC32, needed for every PNG chunk. */
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([length, typeAndData, crc]);
}

/** `pixels` is a size*size array of [r,g,b]. Emits an 8-bit RGB PNG. */
function encodePng(size, pixels) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(2, 9); // colour type 2 = truecolour RGB
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  // Each scanline is prefixed with a filter-type byte; 0 means "none".
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let offset = 0;
  for (let y = 0; y < size; y += 1) {
    raw[offset] = 0;
    offset += 1;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b] = pixels[y * size + x];
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      offset += 3;
    }
  }

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/**
 * Nordic cross: the vertical bar sits left of centre, the horizontal bar is
 * vertically centred. Proportions scaled from the real flag so it still reads
 * as Swedish when iOS crops it to a rounded square.
 */
function flagPixels(size) {
  const barThickness = Math.round(size * 0.2);
  const verticalBarLeft = Math.round(size * 0.3);
  const verticalBarRight = verticalBarLeft + barThickness;
  const horizontalBarTop = Math.round((size - barThickness) / 2);
  const horizontalBarBottom = horizontalBarTop + barThickness;

  const pixels = new Array(size * size);
  for (let y = 0; y < size; y += 1) {
    const inHorizontalBar = y >= horizontalBarTop && y < horizontalBarBottom;
    for (let x = 0; x < size; x += 1) {
      const inVerticalBar = x >= verticalBarLeft && x < verticalBarRight;
      pixels[y * size + x] = inVerticalBar || inHorizontalBar ? YELLOW : BLUE;
    }
  }
  return pixels;
}

const TARGETS = [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
  ["icon-maskable-512.png", 512],
];

mkdirSync(PUBLIC_DIR, { recursive: true });

for (const [name, size] of TARGETS) {
  const png = encodePng(size, flagPixels(size));
  writeFileSync(join(PUBLIC_DIR, name), png);
  console.log(`wrote public/${name} (${size}x${size}, ${png.length} bytes)`);
}
