/**
 * The board's own notes, and their shape.
 *
 * Lives outside the component so the desk can edit them: the wall is a client
 * component holding a reader's private, browser-only notes, and the seven the
 * magazine writes are a different thing entirely — editorial content, which
 * belongs where editorial content is edited.
 */

export type Note = {
  id: string;
  /** The note itself, in the second person, the way people write to themselves. */
  text: string;
  /** How it was signed. Initials, a first name, a time — whatever was given. */
  sign: string;
  /**
   * A picture the desk put on the note. Without one the card keeps the
   * category art its slot carries, which is decorative and needs no alt.
   */
  image?: { url: string; alt: string };
};

export const SEED: Note[] = [
  { id: "s1", text: "Stop rehearsing conversations that are never going to happen.", sign: "M.K. · Lisbon" },
  { id: "s2", text: "The thing you keep postponing is the thing.", sign: "anon · 03:14" },
  { id: "s3", text: "You are allowed to change your mind in public.", sign: "R. · Colombo" },
  { id: "s4", text: "Call your father. Not on his birthday.", sign: "T.A. · Leeds" },
  { id: "s5", text: "Busy is not the same as useful. Check which one today was.", sign: "J." },
  { id: "s6", text: "Nobody is thinking about it as much as you are.", sign: "anon" },
  { id: "s7", text: "Leave the phone in the other room. That is the whole plan.", sign: "D.V. · Berlin" },
];
