"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { Menu, Share2, Twitter, Instagram, Facebook } from "lucide-react";
import { useSession } from "next-auth/react";
import { ModeToggle } from "./mode-toggle";
import { SettingsButton } from "./settings-button";
import NavBar from "./nav-bar";
// import UserButtonClient from "./user-button-client";
import UserButtonClientWithII from "./user-button-client-with-ii";
import { useInterface } from "@/contexts/interface-context";
import { LanguageSwitcher } from "./language-switcher";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "./ui/sheet";
import { Dictionary } from "@/utils/dictionaries";
import { usePathname } from "next/navigation";

// Define a proper type for the dictionary with optional fields
type HeaderDictionary = Dictionary;

export default function Header({ dict, lang }: { dict: HeaderDictionary; lang?: string }) {
  const { data: session, status } = useSession();
  const { mode } = useInterface();
  const pathname = usePathname();
  // Use the passed lang prop if available, otherwise get it from params
  const currentLang = lang || "en";

  // Hide header on gallery preview pages
  const isGalleryPreview = pathname.includes("/gallery/") && pathname.includes("/preview");

  if (isGalleryPreview) {
    return null;
  }

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
      <div className="flex h-16 items-center justify-between px-6">
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
          <div className="hidden md:flex items-center gap-2 transition-opacity hover:opacity-80">
            <UserButtonClientWithII lang={currentLang} />
            {/* <UserButtonClient lang={currentLang} /> */}
          </div>

          {/* Mobile-only sign in button (keep visible, not hidden in menu) */}
          <div className="flex md:hidden items-center gap-2 transition-opacity hover:opacity-80">
            <UserButtonClientWithII lang={currentLang} />
          </div>

          {/* Always visible controls */}
          <div className="transition-opacity hover:opacity-80">
            <LanguageSwitcher />
          </div>

          <div className="transition-opacity hover:opacity-80">
            <ModeToggle />
          </div>

          {/* Settings button - hide on mobile, and hide when unauthenticated */}
          <div className="hidden md:block transition-opacity hover:opacity-80">
            {status === "authenticated" && session?.user ? <SettingsButton /> : null}
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

                  {/* Removed sign-in from mobile menu; sign-in stays in mobile header */}

                  {/* Settings inside mobile menu (only when authenticated) */}
                  {status === "authenticated" && session?.user ? (
                    <div className="border-t pt-4">
                      <SettingsButton />
                    </div>
                  ) : null}

                  {/* Footer Links in Mobile Menu */}
                  <div className="border-t pt-4">
                    <div className="flex flex-col space-y-2">
                      <Link
                        href={`/${currentLang}/terms`}
                        className="transition-all duration-200 ease-in-out px-2 py-2 hover:text-primary hover:bg-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-lg w-full flex items-center text-muted-foreground"
                      >
                        {dict?.footer?.terms || "Terms"}
                      </Link>
                      <Link
                        href={`/${currentLang}/privacy`}
                        className="transition-all duration-200 ease-in-out px-2 py-2 hover:text-primary hover:bg-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-lg w-full flex items-center text-muted-foreground"
                      >
                        {dict?.footer?.privacy || "Privacy"}
                      </Link>
                      <Link
                        href={`/${currentLang}/contact`}
                        className="transition-all duration-200 ease-in-out px-2 py-2 hover:text-primary hover:bg-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-lg w-full flex items-center text-muted-foreground"
                      >
                        {dict?.footer?.contact || "Contact"}
                      </Link>
                      <button
                        onClick={handleShare}
                        className="transition-all duration-200 ease-in-out px-2 py-2 hover:text-primary hover:bg-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-lg w-full flex items-center gap-2 text-muted-foreground"
                      >
                        <Share2 className="h-4 w-4" />
                        <span>{dict?.footer?.share || "Share"}</span>
                      </button>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center gap-4 mt-4 text-muted-foreground">
                      <a
                        href="https://twitter.com/futura"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-primary"
                        aria-label="Twitter"
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                      <a
                        href="https://instagram.com/futura"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-primary"
                        aria-label="Instagram"
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                      <a
                        href="https://facebook.com/futura"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-primary"
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
