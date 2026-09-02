/**
 * Generates the category card art in public/assets/categories.
 *
 * Each file is a horizontal 6-frame sprite strip (6 x 132x176). The cards
 * render it with `image-rendering: pixelated` and step `background-position`
 * through the frames, so the art animates without a canvas or a video.
 *
 * The frames are deliberately tiny: the upscale is what produces the blocks.
 * Everything is drawn from a seeded PRNG re-seeded per frame, so static parts
 * of a scene hold still while only the phase-driven parts move.
 *
 *   node scripts/generate-card-art.js [outDir]
 */
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const W = 132, H = 176, FRAMES = 6;

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
function writePng(file, px, width) {
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (stride + 1)] = 0;
    px.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]));
}

// --- drawing ---------------------------------------------------------------
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

function scene(draw, phase) {
  const px = Buffer.alloc(W * H * 3);
  const set = (x, y, c) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
  };
  const rect = (x, y, w, h, c) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c);
  };
  const disc = (cx, cy, r, c) => {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++)
      if (x * x + y * y <= r * r) set(cx + x, cy + y, c);
  };
  draw({ set, rect, disc, phase });
  return px;
}

// deterministic noise so runs are reproducible
let seed = 7;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

const gradient = (set, top, bottom) => {
  for (let y = 0; y < H; y++) {
    const c = mix(top, bottom, y / H);
    for (let x = 0; x < W; x++) {
      // light dithering keeps the bands from looking like CSS
      const n = (rand() - 0.5) * 7;
      set(x, y, c.map((v) => Math.max(0, Math.min(255, Math.round(v + n)))));
    }
  }
};

const CARDS = [
  {
    name: "unpopular",
    top: "#8a7c4e", bottom: "#14110c", ink: "#0a0908", accent: "#e8d24a",
    draw({ set, rect, disc, phase }, g) {
      g();
      const ridge = (base, amp, y0, c) => {
        for (let x = 0; x < W; x++) {
          const h = y0 + Math.sin(x / base) * amp + Math.sin(x / (base * 0.37)) * (amp * 0.5);
          rect(x, h, 1, H - h, c);
        }
      };
      // cloud band drifting across the sky
      for (let i = 0; i < 900; i++) {
        const y = 8 + rand() * 46;
        const x = (rand() * W + phase * 26) % W;
        set(x, y, mix(hex("#cbbd86"), hex("#6b6040"), rand()));
      }
      ridge(21, 12, 112, hex("#2b2519"));
      ridge(13, 9, 130, hex("#0b0a08"));
      // a figure on the ridge
      rect(70, 100, 3, 12, hex("#050505"));
      disc(71, 97, 2, hex("#050505"));
    },
  },
  {
    name: "untold",
    top: "#1c4f63", bottom: "#03080f", ink: "#02060c", accent: "#4fd0e0",
    draw({ set, rect, disc, phase }, g) {
      g();
      // light shafts
      for (let s = 0; s < 5; s++) {
        const x0 = 8 + s * 27;
        for (let y = 0; y < 120; y++) {
          const w = 3 + (y / 120) * 7;
          for (let i = 0; i < w; i++) {
            const c = mix(hex("#7fe3f0"), hex("#0b2c3a"), y / 120);
            // the shimmer travels down the shaft
            if (rand() > 0.45 - Math.sin((y / 9) + phase * 6.28 + s) * 0.12)
              set(x0 + i + y * 0.08, y, c);
          }
        }
      }
      // motes rising
      for (let i = 0; i < 60; i++) {
        const y = 40 + ((rand() * 120 - phase * 22 + 240) % 120);
        disc(rand() * W, y, rand() > 0.7 ? 2 : 1, hex("#8fd8e6"));
      }
      rect(58, 128, 5, 20, hex("#02090e"));
      disc(60, 125, 3, hex("#02090e"));
    },
  },
  {
    name: "reality-check",
    top: "#6a4a25", bottom: "#120b05", ink: "#0e0803", accent: "#e08a3c",
    draw({ set, rect, disc, phase }, g) {
      g();
      // concentric arches, like looking down a spiral, pulsing outward
      for (let r = 20 + phase * 9; r < 96; r += 9) {
        for (let a = 0; a < Math.PI * 2; a += 0.02) {
          const c = mix(hex("#d9a05a"), hex("#160d05"), r / 96);
          if (rand() > 0.25) set(W / 2 + Math.cos(a) * r, 92 + Math.sin(a) * r * 0.72, c);
        }
      }
      rect(64, 96, 4, 14, hex("#0a0603"));
      disc(66, 93, 2, hex("#0a0603"));
    },
  },
  {
    name: "deep-dives",
    top: "#2a2354", bottom: "#06040f", ink: "#05040d", accent: "#a98cf0",
    draw({ set, rect, disc, phase }, g) {
      g();
      // a spiral of stars, turning
      for (let i = 0; i < 900; i++) {
        const a = i * 0.19 + phase * 0.35;
        const r = i * 0.075;
        const c = mix(hex("#e6dcff"), hex("#5b46a8"), Math.min(1, r / 70));
        set(W / 2 + Math.cos(a) * r * 1.15, 78 + Math.sin(a) * r * 0.6, c);
      }
      // a few stars blink between frames
      for (let i = 0; i < 120; i++) {
        const twinkle = (i % 5) / 5;
        const on = Math.abs(twinkle - phase) > 0.12;
        if (on) set(rand() * W, rand() * H, hex("#cfc4f5"));
        else rand(), rand();
      }
      rect(64, 140, 4, 14, hex("#04030a"));
      disc(66, 137, 2, hex("#04030a"));
    },
  },
  {
    name: "nature",
    top: "#3d5c2a", bottom: "#060c05", ink: "#050a04", accent: "#8fce5a",
    draw({ set, rect, disc, phase }, g) {
      g();
      for (let t = 0; t < 9; t++) {
        const x = 4 + t * 15 + rand() * 5;
        const w = 4 + rand() * 6;
        const shade = mix(hex("#1c2d15"), hex("#050a04"), rand());
        rect(x, 0, w, H, shade);
      }
      // canopy light, swaying
      for (let i = 0; i < 260; i++) {
        const y = rand() * 90;
        const sway = Math.sin(phase * 6.28 + y / 14) * 2.2;
        set(rand() * W + sway, y, mix(hex("#c8e79a"), hex("#3d5c2a"), y / 90));
      }
      // leaves falling
      for (let i = 0; i < 14; i++) {
        const y = (rand() * H + phase * 30) % H;
        set(rand() * W, y, hex("#9ec96a"));
      }
      rect(66, 132, 4, 16, hex("#040803"));
      disc(68, 129, 2, hex("#040803"));
    },
  },
  {
    name: "human",
    top: "#5d7896", bottom: "#05080d", ink: "#04070b", accent: "#6fa8ef",
    draw({ set, rect, disc, phase }, g) {
      g();
      // a crowd, receding — near rows dark and irregular, far rows hazy
      for (let row = 0; row < 8; row++) {
        const y = 168 - row * 19;
        const near = row / 7;
        for (let x = -6; x < W + 6; x += 6 + rand() * 7) {
          const h = (30 - row * 2.6) * (0.75 + rand() * 0.5);
          const w = Math.max(2, 5 - row * 0.35);
          const c = mix(hex("#080d14"), hex("#7d97b4"), near * (0.55 + rand() * 0.45));
          // each figure bobs on its own offset, so the crowd shifts about
          const bob = Math.sin(phase * 6.28 + x * 0.35 + row) * 1.4;
          rect(x, y - h + bob, w, h, c);
          disc(x + w / 2 - 0.5, y - h - w * 0.5 + bob, Math.max(1, w * 0.55), c);
        }
      }
    },
  },
];

const out = path.resolve(process.argv[2] || "public/assets/categories");
fs.mkdirSync(out, { recursive: true });
for (const card of CARDS) {
  const stripW = W * FRAMES;
  const strip = Buffer.alloc(stripW * H * 3);
  for (let f = 0; f < FRAMES; f++) {
    // same seed every frame: static parts of the scene must not flicker
    seed = 7;
    const frame = scene(
      (api) => card.draw(api, () => gradient(api.set, hex(card.top), hex(card.bottom))),
      f / FRAMES,
    );
    for (let y = 0; y < H; y++) {
      frame.copy(strip, (y * stripW + f * W) * 3, y * W * 3, (y + 1) * W * 3);
    }
  }
  writePng(path.join(out, `${card.name}.png`), strip, stripW);
  console.log("wrote", card.name, `${stripW}x${H}`);
}
