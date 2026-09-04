import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

/**
 * The card a shared link unfurls into, on every route that does not draw its
 * own. The masthead in its two hands, the pixel mark, the site's ink.
 *
 * Satori only understands flexbox and a subset of CSS, so this is laid out
 * with plain rows and absolutely positioned squares rather than the grid the
 * site itself uses.
 *
 * All three faces have to be handed over explicitly: passing `fonts` replaces
 * next/og's default list rather than extending it, so the body copy would
 * otherwise be set in whichever display cut came first. Geist is pulled from
 * the copy next/og already ships — the same face the site sets for body text —
 * so nothing new is vendored for one image.
 */
export const alt =
  "Glitch Decoded — a magazine for the things the scroll hurries past";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const assets = join(process.cwd(), "public", "assets");

// Split and rejoined at runtime on purpose: written as one static specifier,
// Turbopack tries to bundle the .ttf as a module and has no loader for it.
const GEIST = "next/dist/compiled/@vercel/og/Geist-Regular.ttf".split("/");

const [signature, pixel, geist] = await Promise.all([
  readFile(join(assets, "paquthy.otf")),
  readFile(join(assets, "AstheticPixelDemoRegular-2v148.otf")),
  readFile(join(process.cwd(), "node_modules", ...GEIST)),
]);

const INK = "#07070c";
const YELLOW = "#efe87b";
const RED = "#ec1b2e";
const BONE = "#f4f4f5";

/** The nine squares of the site icon, at `unit` px, as absolute boxes. */
function Mark({ unit }: { unit: number }) {
  const at = [1, 6, 11];
  const squares = at.flatMap((x, col) =>
    at.map((y, row) => ({
      x,
      // The middle column rides a unit low — the same displacement as icon.svg.
      y: y + (col === 1 ? 1 : 0),
      fill: col === 1 && row === 1 ? RED : YELLOW,
    })),
  );

  return (
    <div style={{ display: "flex", position: "relative", width: 16 * unit, height: 16 * unit }}>
      {squares.map((square) => (
        <div
          key={`${square.x}-${square.y}`}
          style={{
            position: "absolute",
            left: square.x * unit,
            top: square.y * unit,
            width: 4 * unit,
            height: 4 * unit,
            background: square.fill,
          }}
        />
      ))}
    </div>
  );
}

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: INK,
          color: BONE,
          fontFamily: "Geist",
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Mark unit={4} />
          <div
            style={{
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: BONE,
              opacity: 0.55,
            }}
          >
            Independent magazine
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 28, color: YELLOW }}>
            <div style={{ fontFamily: "Paquthy", fontSize: 190, lineHeight: 0.78 }}>Glitch</div>
            <div style={{ fontFamily: "Asthetic Pixel", fontSize: 118, lineHeight: 0.9 }}>
              DECODED
            </div>
          </div>

          <div
            style={{
              marginTop: 34,
              maxWidth: 900,
              fontSize: 30,
              lineHeight: 1.4,
              color: BONE,
              opacity: 0.72,
            }}
          >
            A magazine for the things the scroll hurries past. One piece at a
            time, and no algorithm deciding which.
          </div>
        </div>

        {/* The footer's colour bar, cut to the same proportions. */}
        <div style={{ display: "flex", width: "100%", height: 10, gap: 8 }}>
          <div style={{ flex: 3, background: RED }} />
          <div style={{ flex: 6, background: YELLOW }} />
          <div style={{ flex: 2, background: "#4de2ff", opacity: 0.7 }} />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: geist, style: "normal", weight: 400 },
        { name: "Paquthy", data: signature, style: "normal", weight: 400 },
        { name: "Asthetic Pixel", data: pixel, style: "normal", weight: 400 },
      ],
    },
  );
}
