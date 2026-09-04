/**
 * The quick asks under the composer.
 *
 * Shared by the panel and the route, so the label a writer pressed and the
 * method the model is handed can never drift apart. Only `label` and `ask`
 * cross to the browser — the method note each mode carries lives server-side
 * in `companion.ts`, because it is the part that shapes the answer and there
 * is no reason to publish it.
 */
export type CompanionMode =
  | "interview"
  | "spine"
  | "avoiding"
  | "thin"
  | "against"
  | "unstick"
  | "draft";

export type QuickAsk = {
  id: CompanionMode;
  /** What the button says. */
  label: string;
  /** What is sent as the writer's turn, so the thread reads as a conversation. */
  ask: string;
};

export const QUICK_ASKS: QuickAsk[] = [
  {
    id: "interview",
    label: "Interview me",
    ask: "Interview me about this piece. One question at a time.",
  },
  {
    id: "spine",
    label: "Find the spine",
    ask: "What is this actually about? Say it back to me in one sentence.",
  },
  {
    id: "avoiding",
    label: "What am I avoiding?",
    ask: "What am I circling here without saying?",
  },
  {
    id: "thin",
    label: "Where's it thin?",
    ask: "Where does this not hold up yet?",
  },
  {
    id: "against",
    label: "Argue against me",
    ask: "Make the strongest case against what I'm arguing.",
  },
  {
    id: "unstick",
    label: "I'm stuck",
    ask: "I'm stuck. Help me find the next move.",
  },
  {
    id: "draft",
    label: "Draft me a passage",
    ask: "Draft a rough passage for the part we've been talking about — raw material I can rewrite.",
  },
];

export function isCompanionMode(value: unknown): value is CompanionMode {
  return (
    typeof value === "string" && QUICK_ASKS.some((ask) => ask.id === value)
  );
}

/** One exchange in a thread, in the shape both the panel and the store use. */
export type CompanionMessage = {
  id: string;
  role: "user" | "assistant";
  body: string;
  createdAt: string;
};
