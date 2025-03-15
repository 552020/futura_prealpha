"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { UserCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { ModeToggle } from "./mode-toggle";
import { NavBar } from "./nav-bar";
// import UserButton from "./user-button";
import UserButtonClient from "./user-button-client";
import { useInterface } from "@/contexts/interface-context";
import { useEffect, useState } from "react";
// import { SignIn } from "@/components/auth-components";
import { signIn } from "next-auth/react";
import { LanguageSwitcher } from "./language-switcher";
import { Dictionary } from "@/app/[lang]/dictionaries";

export default function Header({ dict, lang }: { dict?: Dictionary; lang?: string }) {
  const { data: session, status } = useSession();
  const { mode } = useInterface();
  const [imageError, setImageError] = useState(false);
  // Use the passed lang prop if available, otherwise default to "en"
  const currentLang = lang || "en";

  // Check for missing translations and log warnings in development
  if (process.env.NODE_ENV === "development" && !dict?.header?.signIn) {
    console.warn(
      `[i18n] Missing translation for "header.signIn" in locale "${currentLang}". Using fallback: "Sign In"`
    );
  }

  // Add detailed logging
  console.log("Session Status:", status); // "loading" | "authenticated" | "unauthenticated"
  console.log("Session Data:", session); // Session object or null

  // Log specific session details if authenticated
  if (status === "authenticated" && session) {
    console.log("User ID:", session.user?.id);
    console.log("User Email:", session.user?.email);
    console.log("Session Expires:", session.expires);
    console.log("Full session object:", JSON.stringify(session, null, 2));
  }

  // Add effect to log status changes
  useEffect(() => {
    console.log("Status changed to:", status);
    console.log("Session is now:", session);
  }, [status, session]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-slate-950">
      <div className="container mx-auto flex h-16 items-center px-4">
        {/* Left: Logo section with adjusted margin */}
        <section className="logo-section flex items-center mr-8">
          <Link href={`/${currentLang}`}>
            <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center overflow-hidden">
              {!imageError ? (
                <Image
                  src="/images/logo.png"
                  alt="Futura Logo"
                  width={40}
                  height={40}
                  onError={() => setImageError(true)}
                  className="object-cover"
                />
              ) : (
                <span className="text-xl sm:text-2xl font-bold text-white dark:text-black">F</span>
              )}
            </div>
          </Link>
        </section>

        {/* Center: Navigation with improved spacing */}
        <nav className="navigation-section flex flex-1 justify-center gap-8 text-xs sm:text-sm">
          <NavBar mode={mode} lang={currentLang} dict={dict} />
        </nav>

        {/* Right User controls */}
        <section className="user-controls-section flex items-center gap-4 sm:gap-6">
          <UserButtonClient />
          {status === "loading" ? (
            <div className="border-l pl-2">
              <Button variant="ghost" size="icon" disabled>
                <UserCircle className="h-5 w-5 opacity-50" />
              </Button>
            </div>
          ) : status === "authenticated" && session?.user?.id ? (
            <div className="border-l pl-2">
              <Link href={`/${currentLang}/user/${session.user.id}/profile`}>
                <Button variant="ghost" size="icon">
                  <UserCircle className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="border-l pl-2">
              <Button variant="ghost" onClick={() => signIn()}>
                {dict?.header?.signIn || "Sign In"}
              </Button>
            </div>
          )}
          <LanguageSwitcher />
          <ModeToggle />
        </section>
      </div>
    </header>
  );
}

/** Note about useSession()
 * useSession() returns an object containing two values: data and status:
 *
 * data: This can be three values: Session / undefined / null.
 * - when the session hasn't been fetched yet, data will be undefined
 * - in case it failed to retrieve the session, data will be null
 * - in case of success, data will be Session.
 *
 * status: enum mapping to three possible session states:
 * - "loading" | "authenticated" | "unauthenticated"
 *
 * Example Session Object:
 * {
 *   user: {
 *     name: string
 *     email: string
 *     image: string
 *   },
 *   expires: Date // This is the expiry of the session, not any of the tokens within the session
 * }
 *
 * Note: The session data returned to the client does not contain sensitive information
 * such as the Session Token or OAuth tokens. It contains a minimal payload that includes
 * enough data needed to display information on a page about the user who is signed in
 * for presentation purposes (e.g name, email, image).
 **/
