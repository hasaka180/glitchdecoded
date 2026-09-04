import type { Models } from "node-appwrite";

import type { CategorySlug } from "@/lib/categories";

/**
 * Where a piece sits in the editorial pipeline.
 *
 * A creator moves work forward as far as `in_review` and no further; only a
 * superadmin can publish, reject, or send it back. `changes_requested` is a
 * distinct state from `draft` so the dashboard can surface the review note and
 * the writer knows the piece is waiting on them rather than on the desk.
 */
export type ArticleStatus =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "published"
  | "rejected";

export const ARTICLE_STATUSES: ArticleStatus[] = [
  "draft",
  "in_review",
  "changes_requested",
  "published",
  "rejected",
];

export const STATUS_LABEL: Record<ArticleStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  changes_requested: "Changes requested",
  published: "Published",
  rejected: "Rejected",
};

/** Accent per state, drawn from the site palette rather than a generic red/green. */
export const STATUS_HUE: Record<ArticleStatus, string> = {
  draft: "#9a9aa2",
  in_review: "#4de2ff",
  changes_requested: "#e08a3c",
  published: "#8fce5a",
  rejected: "#ec1b2e",
};

/** States whose content the writer may still edit. */
export const EDITABLE_STATUSES: ArticleStatus[] = [
  "draft",
  "changes_requested",
  "rejected",
];

export type ArticleRow = Models.Row & {
  title: string;
  slug: string;
  dek: string;
  body: string;
  category: CategorySlug;
  status: ArticleStatus;
  authorId: string;
  authorName: string;
  coverImageId: string | null;
  coverImageUrl: string | null;
  /** How the cover was obtained, so the editor can show its provenance. */
  coverSource: "upload" | "ai" | null;
  coverPrompt: string | null;
  /** Describes the cover for screen readers and for search. */
  coverAlt: string | null;
  /** Topic slugs from `lib/topics.ts`. What the piece is about, across categories. */
  topics: string[];
  minutes: number;
  views: number;
  likes: number;
  dislikes: number;
  seoTitle: string | null;
  seoDescription: string | null;
  /** The desk's note back to the writer, set with a rejection or a bounce-back. */
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  submittedAt: string | null;
  publishedAt: string | null;
};

export type RevisionRow = Models.Row & {
  articleId: string;
  title: string;
  dek: string;
  body: string;
  category: string;
  /** Who saved it, so a bounce-back cycle reads as a conversation. */
  savedBy: string;
  savedByName: string;
  /** Set when the snapshot was taken at a pipeline move rather than an autosave. */
  note: string | null;
};

/** Average adult reading speed, rounded to a floor of one minute. */
export function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/**
 * URL-safe slug from a title. Collisions are resolved by the caller, which
 * appends a short suffix — titles on this site repeat more than you'd think.
 */
export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/['\u2019]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "untitled"
  );
}
