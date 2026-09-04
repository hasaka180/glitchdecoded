import type { Metadata } from "next";

import AuthForm from "@/components/cms/AuthForm";
import { signIn } from "@/lib/actions/auth";

export const metadata: Metadata = {
  title: "Sign in — A Glitch in the Matrix",
  // The dashboard is private; there is nothing here worth indexing.
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <AuthForm
      mode="signin"
      action={signIn}
      next={typeof next === "string" ? next : "/dashboard"}
    />
  );
}
