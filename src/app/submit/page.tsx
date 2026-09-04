import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/dal";

/**
 * Submitting a glitch is an account action: a piece is written and handed to
 * the desk from the dashboard, not mailed in.
 *
 * The route is kept rather than removed because "Submit a glitch" is linked
 * from the nav, the footer, the article sign-offs and two pages — this way the
 * decision of where that lands lives in one file. A visitor is sent to sign in
 * and returned to the desk afterwards; a contributor goes straight there.
 */
export default async function SubmitPage() {
  const user = await getCurrentUser();
  redirect(user ? "/dashboard" : "/login?next=/dashboard");
}
