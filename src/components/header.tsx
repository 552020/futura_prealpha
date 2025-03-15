"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { UserCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { ModeToggle } from "./mode-toggle";
import { NavBar } from "./nav-bar";
// import UserButton from "./user-button";
import UserButtonClient from "./user-button-client";
import { useInterface } from "@/contexts/interface-context";
import { useEffect } from "react";
// import { SignIn } from "@/components/auth-components";
import { signIn } from "next-auth/react";
import { LanguageSwitcher } from "./language-switcher";
import { useParams } from "next/navigation";

// Define a proper type for the dictionary
type HeaderDictionary = {
  nav: {
    home: string;
    about: string;
    profile: string;
    settings: string;
    getStarted: string;
    [key: string]: string;
  };
  [key: string]: any;
};

export default function Header({ dict }: { dict?: HeaderDictionary }) {
  const { data: session, status } = useSession();
  const { mode } = useInterface();
  const params = useParams();
  const lang = (params.lang as string) || "en";

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
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Logo section */}
        <section className="logo-section flex items-center">
          <Link href={`/${lang}`}>
            <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center">
              <span className="text-xl sm:text-2xl font-bold text-white dark:text-black">F</span>
            </div>
          </Link>
        </section>

        {/* Center: Navigation */}
        <nav className="navigation-section flex flex-1 justify-center gap-6 text-xs sm:text-sm">
          <NavBar mode={mode} lang={lang} dict={dict} />
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
              <Link href={`/${lang}/user/${session.user.id}/profile`}>
                <Button variant="ghost" size="icon">
                  <UserCircle className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="border-l pl-2">
              <Button variant="ghost" size="icon" onClick={() => signIn()}>
                <UserCircle className="h-5 w-5" />
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
