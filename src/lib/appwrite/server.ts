import "server-only";

import { cookies } from "next/headers";
import { Account, Client, Storage, TablesDB, Users } from "node-appwrite";

import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  SESSION_COOKIE,
} from "./config";

/**
 * A Client is never shared between requests: Appwrite auth state lives on the
 * instance, so a reused client can leak one reader's session into another's
 * response. Every helper below builds a fresh one.
 */
function baseClient(): Client {
  return new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);
}

/**
 * Acts as the signed-in reader. Used for anything that should fail when the
 * session is missing or expired — chiefly reading the current account.
 *
 * Returns null rather than throwing when there is no session cookie, so
 * callers can distinguish "signed out" from "something broke".
 */
export async function createSessionClient() {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!session) return null;

  const client = baseClient().setSession(session);

  return {
    get account() {
      return new Account(client);
    },
    get tablesDB() {
      return new TablesDB(client);
    },
    get storage() {
      return new Storage(client);
    },
  };
}

/**
 * Acts as the project itself, bypassing row permissions.
 *
 * Content here is deliberately read and written through this client rather
 * than through per-row Appwrite permissions, because the editorial rules do
 * not decompose into row ACLs: a superadmin must read drafts they do not own,
 * and view counts must rise for signed-out readers. Authorization is therefore
 * enforced in one auditable place — `src/lib/auth/dal.ts` — and every action
 * that touches data calls into it first.
 */
export function createAdminClient() {
  const key = process.env.APPWRITE_API_KEY;
  if (!key) {
    throw new Error(
      "Missing APPWRITE_API_KEY. Copy .env.example to .env.local and fill it in, then restart the dev server.",
    );
  }

  const client = baseClient().setKey(key);

  return {
    get account() {
      return new Account(client);
    },
    get tablesDB() {
      return new TablesDB(client);
    },
    get storage() {
      return new Storage(client);
    },
    get users() {
      return new Users(client);
    },
  };
}
