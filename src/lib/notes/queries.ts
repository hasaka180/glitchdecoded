import "server-only";

import { Query, type Models } from "node-appwrite";

import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { SEED, type Note } from "@/lib/notes/seed";

/**
 * The board's notes, from the desk.
 *
 * Only the magazine's own. A reader's pinned notes live in their browser and
 * never reach a server — that is the promise the page makes to them in so many
 * words, and nothing here changes it.
 */

export type NoteRow = Models.Row & {
  text: string;
  sign: string;
  imageId: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  position: number;
};

export function rowToNote(row: NoteRow): Note {
  return {
    id: row.$id,
    text: row.text,
    sign: row.sign ?? "",
    ...(row.imageUrl
      ? { image: { url: row.imageUrl, alt: row.imageAlt ?? "" } }
      : {}),
  };
}

export async function listNoteRows(): Promise<NoteRow[]> {
  const res = await createAdminClient().tablesDB.listRows<NoteRow>({
    databaseId: DATABASE_ID,
    tableId: TABLES.notes,
    queries: [Query.orderAsc("position"), Query.limit(100)],
  });
  return res.rows;
}

/** Falls back to the file, so an empty table still shows a board. */
export async function listNotes(): Promise<Note[]> {
  try {
    const rows = await listNoteRows();
    if (rows.length > 0) return rows.map(rowToNote);
  } catch {
    // Unprovisioned or unreachable; the seed below is the whole point.
  }
  return SEED;
}
