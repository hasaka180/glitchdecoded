import "server-only";

import sharp from "sharp";

import { STORED_MAX_BYTES } from "@/lib/storage/config";

/**
 * Turning whatever was picked into the one thing the bucket keeps.
 *
 * Writers upload what their phone or their camera gave them — a 6 MB JPEG at
 * 4032 px wide is the normal case, not the exceptional one — and none of that
 * is what a reader should have to download. So nothing is passed through: every
 * upload is decoded and re-encoded as WebP, at a size the design actually
 * draws, until it fits under `STORED_MAX_BYTES`.
 *
 * The cost is one decode on upload, in a Server Action the writer is already
 * waiting on. The alternative — trusting the file — is paid by every reader,
 * every time, forever.
 */

/**
 * The longest edge the site ever draws, and the reason resizing comes before
 * any argument about quality: a 4032 px cover shown at 1600 spends its bytes
 * on detail the screen throws away.
 *
 * It bounds the longest edge rather than the width so a portrait shot — a note
 * photographed on a phone, held upright — is bounded by its height, which is
 * the dimension doing the damage.
 */
const MAX_EDGE = 1600;

/**
 * Ladder of attempts, coarsest concession last.
 *
 * Quality drops first and the picture only gets smaller once quality has gone
 * far enough that further drops would show as blocking around edges. Nearly
 * every photograph lands on the first or second rung; the lower ones exist for
 * the noisy, detail-dense frames — foliage, grain, confetti — that WebP cannot
 * compress and that would otherwise be rejected.
 */
const RUNGS: ReadonlyArray<{ edge: number; quality: number }> = [
  { edge: MAX_EDGE, quality: 82 },
  { edge: MAX_EDGE, quality: 70 },
  { edge: MAX_EDGE, quality: 58 },
  { edge: 1280, quality: 52 },
  { edge: 1024, quality: 46 },
  { edge: 800, quality: 40 },
];

/** What the encoder produced, and what it had to give up to get there. */
export type EncodedImage = {
  bytes: Buffer;
  width: number;
  height: number;
};

/**
 * Re-encodes an upload as WebP under the ceiling.
 *
 * Throws when even the last rung is too heavy, which the caller turns into a
 * message rather than a stored file: an image that cannot be squeezed to
 * 100 KB at 800 px is not one this site can serve, and quietly storing an
 * oversized cover would break the promise every other cover keeps.
 */
export async function encodeForStorage(input: Buffer): Promise<EncodedImage> {
  // Decoded once and cloned per attempt, so a picture that needs three rungs
  // does not pay for three decodes of the original.
  //
  // `rotate()` with no argument bakes in the EXIF orientation before the
  // metadata carrying it is dropped — without it, a photo taken sideways on a
  // phone is stored sideways.
  const base = sharp(input, { animated: false }).rotate();

  let last: EncodedImage | null = null;

  for (const { edge, quality } of RUNGS) {
    const { data, info } = await base
      .clone()
      // `inside` fits the picture within the box without cropping it, so the
      // longer side lands on `edge` and the shorter one follows; the aspect
      // ratio the writer framed is never touched.
      .resize({
        width: edge,
        height: edge,
        fit: "inside",
        withoutEnlargement: true,
      })
      // `effort: 5` above the default 4: this runs once per upload, and the
      // extra work buys a few percent, which is sometimes a whole rung.
      .webp({ quality, effort: 5 })
      .toBuffer({ resolveWithObject: true });

    last = { bytes: data, width: info.width, height: info.height };
    if (data.byteLength <= STORED_MAX_BYTES) return last;
  }

  throw new ImageTooDenseError(last?.bytes.byteLength ?? 0);
}

/** Named so the caller can tell "too detailed" from "not an image at all". */
export class ImageTooDenseError extends Error {
  constructor(readonly bytes: number) {
    super(`Smallest encoding was ${bytes} bytes, over ${STORED_MAX_BYTES}.`);
    this.name = "ImageTooDenseError";
  }
}
