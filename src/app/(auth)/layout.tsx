/**
 * The ground the sign-in and sign-up screens sit on.
 *
 * The nav floats over every route from the root layout, so the top padding here
 * keeps the heading clear of it. Printed on the same stock as the site's other
 * forms — ink is kept for the hero and the footer.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center paper px-5 pt-32 pb-20 text-[color:var(--ink-brown)]">
      {children}
    </main>
  );
}
