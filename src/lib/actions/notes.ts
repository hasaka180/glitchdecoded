"use server";

import { revalidatePath } from "next/cache";
import { ID } from "node-appwrite";

import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { listNoteRows, type NoteRow } from "@/lib/notes/queries";
import { SEED } from "@/lib/notes/seed";
import { requireSuperadmin } from "@/lib/auth/dal";

/**
 * The board's own notes. Superadmin only, like the video library: this is the
 * magazine writing to its readers, not a contributor's work.
 */

export type NoteState = { error?: string; savedAt?: string };

/** The board's own limit, so a note stays a note. */
const MAX_TEXT = 300;

function db() {
  return createAdminClient().tablesDB;
}

/** Everything the board renders, revalidated together. */
function refresh() {
  revalidatePath("/dashboard/notes");
  revalidatePath("/notes");
  revalidatePath("/");
}

export async function saveNote(
  _prev: NoteState,
  formData: FormData,
): Promise<NoteState> {
  await requireSuperadmin();

  const text = String(formData.get("text") ?? "").trim().slice(0, MAX_TEXT);
  const sign = String(formData.get("sign") ?? "").trim().slice(0, 120);
  const raw = Number.parseInt(String(formData.get("position") ?? "0"), 10);
  const position = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 999) : 0;

  if (!text) return { error: "A note needs something written on it." };

  await db().updateRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.notes,
    rowId: String(formData.get("noteId") ?? ""),
    data: { text, sign, position },
  });

  refresh();
  return { savedAt: new Date().toISOString() };
}

export async function addNote(): Promise<void> {
  await requireSuperadmin();

  const existing = await listNoteRows();
  await db().createRow<NoteRow>({
    databaseId: DATABASE_ID,
    tableId: TABLES.notes,
    rowId: ID.unique(),
    data: {
      text: "",
      sign: "",
      position: (existing.at(-1)?.position ?? -1) + 1,
    },
  });

  refresh();
}

export async function deleteNote(
  _prev: NoteState,
  formData: FormData,
): Promise<NoteState> {
  await requireSuperadmin();

  await db().deleteRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.notes,
    rowId: String(formData.get("noteId") ?? ""),
  });

  refresh();
  return {};
}

/** Copies the notes the file ships with, so the board starts where it is. */
export async function seedNotes(): Promise<void> {
  await requireSuperadmin();

  if ((await listNoteRows()).length > 0) return;

  for (const [index, note] of SEED.entries()) {
    await db().createRow<NoteRow>({
      databaseId: DATABASE_ID,
      tableId: TABLES.notes,
      rowId: ID.unique(),
      data: { text: note.text, sign: note.sign, position: index },
    });
  }

  refresh();
}
