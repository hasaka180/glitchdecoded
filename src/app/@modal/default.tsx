/**
 * Nothing in the slot unless a listing intercepted a piece into it. Without
 * this, a hard load of any route would 404 on the unmatched parallel slot.
 */
export default function ModalDefault() {
  return null;
}
