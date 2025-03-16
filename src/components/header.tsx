"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { UserCircle, Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import { ModeToggle } from "./mode-toggle";
import { NavBar } from "./nav-bar";
import UserButtonClient from "./user-button-client";
import { useInterface } from "@/contexts/interface-context";
import { signIn } from "next-auth/react";
import { LanguageSwitcher } from "./language-switcher";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "./ui/sheet";

// Define a proper type for the dictionary with optional fields
type HeaderDictionary = {
  nav?: {
    home?: string;
    about?: string;
    profile?: string;
    settings?: string;
    getStarted?: string;
    faq?: string;
    signIn?: string;
  };
};

export default function Header({ dict, lang }: { dict?: HeaderDictionary; lang?: string }) {
  const { data: session, status } = useSession();
  const { mode } = useInterface();
  // Use the passed lang prop if available, otherwise get it from params
  const currentLang = lang || "en";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-slate-950">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Logo section */}
        <section className="logo-section flex items-center">
          <Link href={`/${currentLang}`}>
            <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center">
              <span className="text-xl sm:text-2xl font-bold text-white dark:text-black">F</span>
            </div>
          </Link>
        </section>

        {/* Center: Navigation - DESKTOP ONLY */}
        <nav className="navigation-section hidden md:flex flex-1 justify-center gap-6 text-xs sm:text-sm">
          <NavBar mode={mode} lang={currentLang} dict={dict} />
        </nav>

        {/* Right User controls */}
        <section className="user-controls-section flex items-center gap-4 sm:gap-6">
          {/* Desktop-only user controls */}
          <div className="hidden md:block">
            <UserButtonClient />
          </div>

          {/* Profile button - desktop only */}
          <div className="hidden md:block border-l pl-2">
            {status === "loading" ? (
              <Button variant="ghost" size="icon" disabled>
                <UserCircle className="h-5 w-5 opacity-50" />
              </Button>
            ) : status === "authenticated" && session?.user?.id ? (
              <Link href={`/${currentLang}/user/${session.user.id}/profile`}>
                <Button variant="ghost" size="icon">
                  <UserCircle className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => signIn()}>
                <UserCircle className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Always visible controls */}
          <LanguageSwitcher />
          <ModeToggle />

          {/* Mobile: Burger menu - MOBILE ONLY */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetTitle className="text-lg font-semibold mb-4">Menu</SheetTitle>
                <div className="py-4">
                  {/* Mobile navigation with better spacing */}
                  <nav className="flex flex-col space-y-4">
                    <NavBar mode={mode} lang={currentLang} dict={dict} className="mobile" />
                  </nav>

                  {/* User controls inside the menu for mobile */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="mb-4">
                      <UserButtonClient />
                    </div>

                    {status === "loading" ? (
                      <Button variant="ghost" size="sm" disabled className="w-full justify-start">
                        <UserCircle className="h-5 w-5 mr-2 opacity-50" />
                        <span>Loading...</span>
                      </Button>
                    ) : status === "authenticated" && session?.user?.id ? (
                      <Link href={`/${currentLang}/user/${session.user.id}/profile`}>
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <UserCircle className="h-5 w-5 mr-2" />
                          <span>{dict?.nav?.profile || "Profile"}</span>
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => signIn()} className="w-full justify-start">
                        <UserCircle className="h-5 w-5 mr-2" />
                        <span>{dict?.nav?.signIn || "Sign In"}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </section>
      </div>
    </header>
  );
}
