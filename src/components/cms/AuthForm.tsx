"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { AuthState } from "@/lib/actions/auth";

import {
  BUTTON_PRIMARY,
  ERROR_BOX_LIGHT,
  EYEBROW,
  INPUT_LIGHT,
  LABEL,
} from "./ui";

/**
 * Lives in its own component so the button can read `useFormStatus`, which only
 * reports on a form rendered above it.
 */
function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={BUTTON_PRIMARY} disabled={pending}>
      {pending ? "One moment…" : label}
    </button>
  );
}

type Props = {
  mode: "signin" | "signup";
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  /** Where to land after success. Validated server-side before it is used. */
  next: string;
};

export default function AuthForm({ mode, action, next }: Props) {
  const [state, formAction] = useActionState<AuthState, FormData>(action, {});
  const isSignUp = mode === "signup";

  return (
    <div className="w-full max-w-[26rem]">
      <p className={EYEBROW}>{isSignUp ? "New contributor" : "Welcome back"}</p>
      <h1 className="mt-4 font-pixel text-[28px] leading-[1.15] uppercase sm:text-[36px]">
        {isSignUp ? "Start a glitch" : "Sign in"}
      </h1>
      <p className="mt-4 font-garamond text-[17px] leading-[1.5] opacity-65">
        {isSignUp
          ? "Write the piece nobody else will. Everything you submit goes to the desk before it goes live."
          : "Pick up where you left off."}
      </p>

      <form action={formAction} className="mt-10 flex flex-col gap-6">
        <input type="hidden" name="next" value={next} />

        {isSignUp && (
          <div>
            <label className={LABEL} htmlFor="name">
              Your name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              maxLength={120}
              className={INPUT_LIGHT}
              placeholder="How your byline should read"
            />
          </div>
        )}

        <div>
          <label className={LABEL} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={INPUT_LIGHT}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={isSignUp ? 8 : undefined}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className={INPUT_LIGHT}
            placeholder={isSignUp ? "At least 8 characters" : "••••••••"}
          />
        </div>

        {state.error && (
          <p className={ERROR_BOX_LIGHT} role="alert">
            {state.error}
          </p>
        )}

        <div className="mt-2">
          <Submit label={isSignUp ? "Create account" : "Sign in"} />
        </div>
      </form>

      <p className="mt-8 font-garamond text-[16px] opacity-60">
        {isSignUp ? "Already have an account? " : "No account yet? "}
        <Link
          // Carried across the swap, so somebody sent here from a gated page
          // still lands where they were headed after taking the other door.
          href={`${isSignUp ? "/login" : "/signup"}?next=${encodeURIComponent(next)}`}
          className="underline decoration-[color:var(--cyan)] underline-offset-4 transition-colors hover:text-[color:var(--cyan)]"
        >
          {isSignUp ? "Sign in" : "Create one"}
        </Link>
      </p>
    </div>
  );
}
