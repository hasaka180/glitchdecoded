"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppwriteException, ID } from "node-appwrite";

import { SESSION_COOKIE } from "@/lib/appwrite/config";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";

export type AuthState = { error?: string };

/**
 * Where a form may send the reader after signing in. Anything that is not a
 * site-relative path is discarded: a `next` parameter is attacker-controlled,
 * and an unchecked one turns the login page into an open redirect.
 */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

/** Appwrite's minimum; stated up front rather than discovered on submit. */
const MIN_PASSWORD = 8;

async function storeSession(secret: string, expire: string) {
  (await cookies()).set(SESSION_COOKIE, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expire),
  });
}

/**
 * Appwrite's messages are written for developers ("Invalid `password` param:
 * Password must be at least 8 characters"). These are the reader-facing ones.
 */
function readableError(error: unknown, fallback: string): string {
  // A swallowed exception here reads to the reader as "your details are wrong"
  // when the truth is usually that the project is misconfigured. The server log
  // is the only place the difference is visible, so it always gets the original.
  console.error("[auth]", error);

  if (error instanceof AppwriteException) {
    switch (error.type) {
      case "general_unauthorized_scope":
        // Not the reader's problem: the API key is missing a scope. Said plainly
        // because the alternative is somebody retyping a correct password.
        return "The site isn't set up to create accounts yet. This is our end, not yours — the desk has been told.";
      case "user_already_exists":
      case "user_email_already_exists":
        return "An account with that email already exists. Try signing in.";
      case "user_invalid_credentials":
        return "That email and password don't match an account.";
      case "user_blocked":
        return "That account has been blocked. Get in touch with the desk.";
      case "general_rate_limit_exceeded":
        return "Too many attempts. Wait a minute and try again.";
      case "password_personal_data":
        return "That password contains your personal details. Pick another.";
      default:
        break;
    }
  }
  return fallback;
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!name) return { error: "Tell us what to call you." };
  if (!email.includes("@")) return { error: "That doesn't look like an email." };
  if (password.length < MIN_PASSWORD) {
    return { error: `Passwords need at least ${MIN_PASSWORD} characters.` };
  }

  try {
    const { account } = createAdminClient();
    await account.create({ userId: ID.unique(), email, password, name });

    // Sign them straight in — a freshly created account bouncing to a login
    // form is the most common way people abandon a signup.
    const session = await account.createEmailPasswordSession({
      email,
      password,
    });
    await storeSession(session.secret, session.expire);
  } catch (error) {
    return { error: readableError(error, "Couldn't create that account.") };
  }

  redirect(next);
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) return { error: "Both fields, please." };

  try {
    const { account } = createAdminClient();
    const session = await account.createEmailPasswordSession({
      email,
      password,
    });
    await storeSession(session.secret, session.expire);
  } catch (error) {
    return {
      error: readableError(error, "That email and password don't match an account."),
    };
  }

  redirect(next);
}

export async function signOut() {
  const session = await createSessionClient();

  // Revoke server-side too. Dropping only the cookie would leave a live session
  // that anyone holding the old secret could keep using.
  try {
    await session?.account.deleteSession({ sessionId: "current" });
  } catch {
    // Already gone, or expired. The cookie still needs clearing either way.
  }

  (await cookies()).delete(SESSION_COOKIE);
  redirect("/");
}
