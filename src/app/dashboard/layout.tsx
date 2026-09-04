import Link from "next/link";

import { signOut } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth/dal";

/**
 * The shell around every dashboard screen.
 *
 * `requireUser` here is a convenience, not the security boundary — a layout can
 * be skipped on a client-side navigation, so each page and every action re-runs
 * its own check against the data.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/dashboard");

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[color:var(--ink)] text-[color:var(--bone)]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[color:var(--ink)]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center gap-x-8 gap-y-4 px-5 py-4 sm:px-10">
          <Link
            href="/dashboard"
            className="font-pixel text-[15px] tracking-[0.02em] uppercase transition-colors hover:text-[color:var(--cyan)]"
          >
            The desk
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="font-arial text-[10px] font-bold tracking-[0.18em] uppercase opacity-60 transition-opacity hover:opacity-100"
            >
              My pieces
            </Link>
            <Link
              href="/dashboard/companion"
              className="font-arial text-[10px] font-bold tracking-[0.18em] uppercase opacity-60 transition-opacity hover:opacity-100"
            >
              The room
            </Link>
            {user.isSuperadmin && (
              <Link
                href="/dashboard/review"
                className="font-arial text-[10px] font-bold tracking-[0.18em] uppercase transition-colors"
                style={{ color: "var(--cyan)" }}
              >
                Review queue
              </Link>
            )}
            <Link
              href="/"
              className="font-arial text-[10px] font-bold tracking-[0.18em] uppercase opacity-60 transition-opacity hover:opacity-100"
            >
              View site
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-5">
            <span className="hidden font-garamond text-[15px] opacity-55 sm:inline">
              {user.name}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="font-arial text-[10px] font-bold tracking-[0.18em] uppercase opacity-50 transition-opacity hover:opacity-100"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-12 sm:px-10 sm:py-16">
        {children}
      </main>
    </div>
  );
}
