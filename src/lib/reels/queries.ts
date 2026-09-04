import "server-only";

import { Query, type Models } from "node-appwrite";

import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { REELS, type Reel } from "@/lib/videos";

/**
 * The video library, from the desk.
 *
 * Same shape as `lib/videos.ts` has always exported, so the set and the
 * programme did not have to change: what moved is where the reels come from.
 * The file stays as the fallback — an unreachable Appwrite, or a table nobody
 * has filled yet, still shows a library rather than an empty room.
 */

export type ReelRow = Models.Row & {
  speaker: string;
  line: string;
  source: string;
  year: string;
  stock: string;
  hue: string;
  inkHue: string;
  url: string;
  runtime: string | null;
  position: number;
};

export function rowToReel(row: ReelRow): Reel {
  return {
    id: row.$id,
    speaker: row.speaker,
    line: row.line ?? "",
    source: row.source ?? "",
    year: row.year ?? "",
    stock: row.stock ?? "",
    hue: row.hue || "#d8b06a",
    inkHue: row.inkHue || "#8a5a12",
    url: row.url ?? "",
    runtime: row.runtime ?? undefined,
  };
}

/** The rows themselves, for the desk's own screen. */
export async function listReelRows(): Promise<ReelRow[]> {
  const res = await createAdminClient().tablesDB.listRows<ReelRow>({
    databaseId: DATABASE_ID,
    tableId: TABLES.reels,
    queries: [Query.orderAsc("position"), Query.limit(100)],
  });
  return res.rows;
}

/**
 * What the public library renders.
 *
 * Falls back to the file on an empty table or an unreachable backend, so the
 * archive on the front of the site never blinks out because of the CMS.
 */
export async function listReels(): Promise<Reel[]> {
  try {
    const rows = await listReelRows();
    if (rows.length > 0) return rows.map(rowToReel);
  } catch {
    // Unprovisioned or unreachable. The file below is the whole point.
  }
  return REELS;
}
