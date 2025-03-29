"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { Menu } from "lucide-react";
// import { useSession } from "next-auth/react";
import { ModeToggle } from "./mode-toggle";
import NavBar from "./nav-bar";
import UserButtonClient from "./user-button-client";
import { useInterface } from "@/contexts/interface-context";
import { LanguageSwitcher } from "./language-switcher";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "./ui/sheet";
import { Dictionary } from "@/utils/dictionaries";

// Define a proper type for the dictionary with optional fields
type HeaderDictionary = Dictionary;

export default function Header({ dict, lang }: { dict: HeaderDictionary; lang?: string }) {
  //   const { data: session, status } = useSession();
  const { mode } = useInterface();
  // Use the passed lang prop if available, otherwise get it from params
  const currentLang = lang || "en";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Logo section */}
        <section className="logo-section flex items-center">
          <Link href={`/${currentLang}`} className="transition-transform hover:scale-105">
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
          <div className="hidden md:block transition-opacity hover:opacity-80">
            <UserButtonClient lang={currentLang} />
          </div>

          {/* Always visible controls */}
          <div className="transition-opacity hover:opacity-80">
            <LanguageSwitcher />
          </div>

          <div className="transition-opacity hover:opacity-80">
            <ModeToggle />
          </div>

          {/* Mobile: Burger menu - MOBILE ONLY */}
          <div className="md:hidden transition-opacity hover:opacity-80">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-muted">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <SheetHeader className="border-b pb-4 mb-4">
                  <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4">
                  <nav className="flex flex-col">
                    <NavBar mode={mode} lang={currentLang} dict={dict} className="mobile" />
                  </nav>

                  <div className="border-t pt-4">
                    <UserButtonClient lang={currentLang} />
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
