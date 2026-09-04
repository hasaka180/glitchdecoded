import type { Metadata } from "next";

import AuthForm from "@/components/cms/AuthForm";
import { signUp } from "@/lib/actions/auth";

export const metadata: Metadata = {
  title: "Create an account — A Glitch in the Matrix",
  robots: { index: false, follow: false },
};

export default async function SignupPage({
  searchParams,
}: PageProps<"/signup">) {
  const { next } = await searchParams;
  return (
    <AuthForm
      mode="signup"
      action={signUp}
      next={typeof next === "string" ? next : "/dashboard"}
    />
  );
}
