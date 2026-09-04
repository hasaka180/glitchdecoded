"use client";

import { useActionState, useState } from "react";

import {
  BUTTON_DANGER,
  BUTTON_GHOST,
  BUTTON_PRIMARY,
  ERROR_BOX,
  INPUT,
  LABEL,
} from "@/components/cms/ui";
import { decideReview, type ArticleState } from "@/lib/actions/articles";

/**
 * The three rulings, as one form.
 *
 * A single form with three `formAction`-less buttons that set `decision` on
 * submit — rather than three forms — so the note the reviewer typed travels
 * with whichever button they press.
 */
export default function ReviewDecision({ articleId }: { articleId: string }) {
  const [state, action, pending] = useActionState<ArticleState, FormData>(
    decideReview,
    {},
  );
  const [note, setNote] = useState("");

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="articleId" value={articleId} />

      <div>
        <label className={LABEL} htmlFor={`note-${articleId}`}>
          Note to the writer
        </label>
        <textarea
          id={`note-${articleId}`}
          name="reviewNote"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={2000}
          className={`${INPUT} resize-y`}
          placeholder="Required unless you're publishing. What needs to change, and why?"
        />
      </div>

      {state.error && (
        <p className={ERROR_BOX} role="alert">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          name="decision"
          value="publish"
          disabled={pending}
          className={BUTTON_PRIMARY}
        >
          {pending ? "Working…" : "Publish"}
        </button>
        <button
          type="submit"
          name="decision"
          value="request_changes"
          disabled={pending || !note.trim()}
          className={BUTTON_GHOST}
          title={note.trim() ? undefined : "Leave a note first"}
        >
          Send back
        </button>
        <button
          type="submit"
          name="decision"
          value="reject"
          disabled={pending || !note.trim()}
          className={BUTTON_DANGER}
          title={note.trim() ? undefined : "Leave a note first"}
        >
          Reject
        </button>
      </div>
    </form>
  );
}
