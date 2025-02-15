import Link from "next/link";
import { Button } from "./ui/button";
import { UserCircle } from "lucide-react";
import { auth } from "@/auth";
import { ModeToggle } from "./mode-toggle";
import NavBar from "./nav-bar";
import UserButton from "./user-button";

export default async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-slate-950">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Logo section */}
        <section className="logo-section flex items-center">
          <Link href="/">
            <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center">
              <span className="text-xl sm:text-2xl font-bold text-white dark:text-black">F</span>
            </div>
          </Link>
        </section>

        {/* Center: Navigation */}
        <nav className="navigation-section flex flex-1 justify-center text-xs sm:text-sm">
          {/* <Link href="/about">About</Link> */}
          <NavBar />
        </nav>

        {/* Right User controls */}
        <section className="user-controls-section flex items-center gap-4 sm:gap-6">
          <UserButton />
          {/* Keep our custom profile button */}
          {session && (
            <div className="border-l pl-2">
              <Link href={`/user/${session.user.id}/profile`}>
                <Button variant="ghost" size="icon">
                  <UserCircle className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}
          <ModeToggle />
        </section>
      </div>
    </header>
  );
}
