/**
 * Generates the raster site icons in src/app.
 *
 *   node scripts/generate-icons.mjs
 *
 * The mark is the same nine-square pixel grid as src/app/icon.svg, kept in
 * sync by hand: a 16-unit grid of 4-unit yellow squares on 1-unit ink
 * gutters, with the middle column dropped a unit — the glitch — and the
 * centre square struck out in red. Every dimension is a whole unit so the
 * grid lands on exact pixels at 16, 32, 48 and 180.
 *
 * Two files come out:
 *
 *   favicon.ico    16 + 32 + 48, for the tab strip and bare /favicon.ico hits
 *   apple-icon.png 180, inset, because iOS rounds and crops what it is given
 *
 * PNG and ICO are both written by hand rather than pulled from a library:
 * nine rectangles do not justify a dependency. Same minimal PNG writer as
 * generate-card-art.js, widened to RGBA.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

// --- minimal PNG writer ----------------------------------------------------
const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = -1;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
function encodePng(px, size) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    px.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- the mark --------------------------------------------------------------
const INK = [7, 7, 12];       // --ink
const YELLOW = [239, 232, 123]; // --yellow
const RED = [236, 27, 46];    // --red

const GRID = 16;
const AT = [1, 6, 11]; // square origins along both axes
const SQUARE = 4;

/** The nine squares as [x, y, colour] on the 16-unit grid. */
function squares() {
  const out = [];
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 3; row++) {
      // The middle column rides a unit low. That displacement is the whole idea.
      const y = AT[row] + (col === 1 ? 1 : 0);
      const colour = col === 1 && row === 1 ? RED : YELLOW;
      out.push([AT[col], y, colour]);
    }
  }
  return out;
}

/**
 * Rasterises the mark at `size` px. `inset` shrinks the grid towards the
 * centre by that fraction of the canvas, leaving ink around it.
 */
function render(size, inset = 0) {
  const px = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    px[i * 4] = INK[0]; px[i * 4 + 1] = INK[1]; px[i * 4 + 2] = INK[2]; px[i * 4 + 3] = 255;
  }
  const span = size * (1 - inset * 2);
  const unit = span / GRID;
  const origin = size * inset;
  for (const [sx, sy, colour] of squares()) {
    const x0 = Math.round(origin + sx * unit);
    const y0 = Math.round(origin + sy * unit);
    const x1 = Math.round(origin + (sx + SQUARE) * unit);
    const y1 = Math.round(origin + (sy + SQUARE) * unit);
    for (let y = Math.max(0, y0); y < Math.min(size, y1); y++) {
      for (let x = Math.max(0, x0); x < Math.min(size, x1); x++) {
        const i = (y * size + x) * 4;
        px[i] = colour[0]; px[i + 1] = colour[1]; px[i + 2] = colour[2]; px[i + 3] = 255;
      }
    }
  }
  return encodePng(px, size);
}

/** Wraps PNGs in an ICO container — legal since Vista, and what browsers read. */
function ico(pngs) {
  const dir = Buffer.alloc(6 + 16 * pngs.length);
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2);
  dir.writeUInt16LE(pngs.length, 4);
  let offset = dir.length;
  pngs.forEach(({ size, data }, i) => {
    const e = 6 + i * 16;
    dir[e] = size >= 256 ? 0 : size;
    dir[e + 1] = size >= 256 ? 0 : size;
    dir[e + 2] = 0; dir[e + 3] = 0;
    dir.writeUInt16LE(1, e + 4);
    dir.writeUInt16LE(32, e + 6);
    dir.writeUInt32LE(data.length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([dir, ...pngs.map((p) => p.data)]);
}

const app = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "app");
fs.writeFileSync(
  path.join(app, "favicon.ico"),
  ico([16, 32, 48].map((size) => ({ size, data: render(size) })))
);
fs.writeFileSync(path.join(app, "apple-icon.png"), render(180, 0.12));
console.log("wrote src/app/favicon.ico and src/app/apple-icon.png");
