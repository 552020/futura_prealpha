"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { Menu, Share2, Twitter, Instagram, Facebook } from "lucide-react";
// import { useSession } from "next-auth/react";
import { ModeToggle } from "./mode-toggle";
import { SettingsButton } from "./settings-button";
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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Futura",
          text: "Check out Futura - Live Forever. Now.",
          url: window.location.href,
        });
        console.log("Content shared successfully");
      } else {
        console.log("Web Share API not supported");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Share was canceled by the user");
        return;
      }
      console.error("Error sharing content:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
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
        <section className="user-controls-section flex items-center gap-2 sm:gap-3">
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

          {/* Settings button - always visible */}
          <div className="transition-opacity hover:opacity-80">
            <SettingsButton />
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

                  {/* Footer Links in Mobile Menu */}
                  <div className="border-t pt-4">
                    <div className="flex flex-col space-y-2">
                      <Link
                        href={`/${currentLang}/terms`}
                        className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                      >
                        {dict?.footer?.terms || "Terms"}
                      </Link>
                      <Link
                        href={`/${currentLang}/privacy`}
                        className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                      >
                        {dict?.footer?.privacy || "Privacy"}
                      </Link>
                      <Link
                        href={`/${currentLang}/contact`}
                        className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                      >
                        {dict?.footer?.contact || "Contact"}
                      </Link>
                      <button
                        onClick={handleShare}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                      >
                        <Share2 className="h-4 w-4" />
                        <span>{dict?.footer?.share || "Share"}</span>
                      </button>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center gap-4 mt-4">
                      <a
                        href="https://twitter.com/futura"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                        aria-label="Twitter"
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                      <a
                        href="https://instagram.com/futura"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                        aria-label="Instagram"
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                      <a
                        href="https://facebook.com/futura"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                        aria-label="Facebook"
                      >
                        <Facebook className="h-4 w-4" />
                      </a>
                    </div>
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
