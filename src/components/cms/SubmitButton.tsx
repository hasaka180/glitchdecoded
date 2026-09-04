"use client";

import { useFormStatus } from "react-dom";

/**
 * A submit button that reports its own form's pending state.
 *
 * Must be a separate component from the form: `useFormStatus` reads the nearest
 * form *above* it in the tree, so a button defined in the same component as its
 * `<form>` always reads idle.
 */
export default function SubmitButton({
  children,
  pendingLabel,
  confirm,
  disabled,
  onClick,
  ...rest
}: React.ComponentProps<"button"> & {
  pendingLabel?: string;
  /** When set, the click must be confirmed before the action runs. */
  confirm?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      {...rest}
      disabled={pending || disabled}
      onClick={(event) => {
        if (confirm && !window.confirm(confirm)) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
