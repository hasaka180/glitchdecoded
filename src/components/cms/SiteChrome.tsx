"use client";

import { usePathname } from "next/navigation";

import CookieNotice from "@/components/CookieNotice";
import GlitchNav from "@/components/GlitchNav";
import MailButton from "@/components/MailButton";
import { setConsent, useConsent } from "@/lib/consent";

/**
 * Everything that floats over a public page: the nav, the cookie notice and the
 * mail button.
 *
 * `GlitchNav` is a fixed, right-aligned cluster at z-50, which would land on
 * top of the dashboard's own header. The dashboard carries a "View site" link
 * instead, so nothing is lost by standing the nav down there — and a consent
 * notice on a screen you can only reach by signing in is asking a question the
 * sign-in already answered.
 *
 * The consent answer is read here rather than inside the notice: the mail
 * button shares the bottom of a phone screen with it and has to know when to
 * step aside. `undefined` is the server and the hydrating render, where storage
 * cannot be seen — neither floating element is drawn until it can.
 */
const APP_ROUTES = ["/dashboard", "/login", "/signup"];

export default function SiteChrome() {
  const pathname = usePathname();
  const consent = useConsent();

  if (APP_ROUTES.some((route) => pathname.startsWith(route))) return null;

  return (
    <>
      <GlitchNav />
      {consent === null && <CookieNotice onChoose={setConsent} />}
      {consent !== undefined && <MailButton lowered={consent === null} />}
    </>
  );
}
