"use server";

import { revalidatePath } from "next/cache";
import { ID } from "node-appwrite";

import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { listReelRows, type ReelRow } from "@/lib/reels/queries";
import { requireSuperadmin } from "@/lib/auth/dal";
import { REELS, youtubeId } from "@/lib/videos";

/**
 * The video library's own actions.
 *
 * Superadmin only, unlike articles: the library is the magazine's, not any one
 * contributor's, so there is no ownership to check — only whether the caller
 * runs the desk. Every action re-checks, because a Server Action is reachable
 * by direct POST and not only through the screen that renders its button.
 */

export type ReelState = { error?: string; savedAt?: string };

function db() {
  return createAdminClient().tablesDB;
}

/** Reads and bounds the fields the desk's form sends. */
function readFields(formData: FormData) {
  const text = (key: string, max: number) =>
    String(formData.get(key) ?? "").trim().slice(0, max);

  const position = Number.parseInt(String(formData.get("position") ?? "0"), 10);

  return {
    speaker: text("speaker", 160),
    line: text("line", 400),
    source: text("source", 200),
    year: text("year", 12),
    stock: text("stock", 60),
    hue: text("hue", 16) || "#d8b06a",
    inkHue: text("inkHue", 16) || "#8a5a12",
    url: text("url", 500),
    runtime: text("runtime", 40),
    position: Number.isFinite(position) ? Math.min(Math.max(position, 0), 999) : 0,
  };
}

export async function saveReel(
  _prev: ReelState,
  formData: FormData,
): Promise<ReelState> {
  await requireSuperadmin();

  const reelId = String(formData.get("reelId") ?? "");
  const fields = readFields(formData);

  if (!fields.speaker) return { error: "A reel needs a speaker." };
  // An empty url is a real state — "not transferred yet". A filled one that
  // isn't a YouTube link is a typo, and silently showing a title card would
  // hide it.
  if (fields.url && youtubeId(fields.url) === null) {
    return { error: "That isn't a YouTube link I can read." };
  }

  await db().updateRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.reels,
    rowId: reelId,
    data: { ...fields, runtime: fields.runtime || null },
  });

  revalidatePath("/dashboard/reels");
  revalidatePath("/video-library");
  revalidatePath("/");
  return { savedAt: new Date().toISOString() };
}

/** Adds an empty reel at the end of the programme. */
export async function addReel(): Promise<void> {
  await requireSuperadmin();

  const existing = await listReelRows();
  const last = existing.at(-1)?.position ?? -1;

  await db().createRow<ReelRow>({
    databaseId: DATABASE_ID,
    tableId: TABLES.reels,
    rowId: ID.unique(),
    data: {
      speaker: "New reel",
      line: "",
      source: "",
      year: "",
      stock: "",
      hue: "#d8b06a",
      inkHue: "#8a5a12",
      url: "",
      runtime: null,
      position: last + 1,
    },
  });

  revalidatePath("/dashboard/reels");
}

export async function deleteReel(
  _prev: ReelState,
  formData: FormData,
): Promise<ReelState> {
  await requireSuperadmin();

  await db().deleteRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.reels,
    rowId: String(formData.get("reelId") ?? ""),
  });

  revalidatePath("/dashboard/reels");
  revalidatePath("/video-library");
  revalidatePath("/");
  return {};
}

/**
 * Copies the six reels the file ships with into the table.
 *
 * The library was a source file before it was a screen, and retyping six
 * entries with their two hues each to get started is the kind of chore that
 * stops a migration happening at all. Refuses once the table has anything in
 * it, so it cannot double the programme.
 */
export async function seedReels(): Promise<void> {
  await requireSuperadmin();

  const existing = await listReelRows();
  if (existing.length > 0) return;

  for (const [index, reel] of REELS.entries()) {
    await db().createRow<ReelRow>({
      databaseId: DATABASE_ID,
      tableId: TABLES.reels,
      rowId: ID.unique(),
      data: {
        speaker: reel.speaker,
        line: reel.line,
        source: reel.source,
        year: reel.year,
        stock: reel.stock,
        hue: reel.hue,
        inkHue: reel.inkHue,
        url: reel.url,
        runtime: reel.runtime ?? null,
        position: index,
      },
    });
  }

  revalidatePath("/dashboard/reels");
  revalidatePath("/video-library");
}
