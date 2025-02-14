"use client";

// This is the header component from the Auth.js example.
// import NavBar from "./nav-bar";
// import UserButton from "./user-button";

// export default function Header() {
//   return (
//     <header className="sticky flex justify-center border-b">
//       <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
//         <NavBar />
//         <UserButton />
//       </div>
//     </header>
//   );
// }

"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { UserCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import AuthModal from "./auth-modal";
import { ModeToggle } from "./mode-toggle";
import { useRouter } from "next/navigation";
import NavBar from "./nav-bar";
export default function Header() {
  const { data: session } = useSession();
  // TODO: Check sessfion in Auth.js v4 vs v5
  // https://authjs.dev/getting-started/migrating-to-v5#authenticating-server-side
  console.log("Session", session);
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Simple redirect - will need improvement
  const handleProfileClick = () => {
    // TODO: Improve this with proper session handling
    router.push("/user/123/profile"); // Hardcoded for now
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-slate-950">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Logo section */}
        <section className="logo-section flex items-center">
          <Link href="/">
            <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center">
              <span className="text-2xl font-bold text-white dark:text-black">F</span>
            </div>
          </Link>
        </section>

        {/* Center: Navigation */}
        <nav className="navigation-section flex flex-1 justify-center">
          {/* <Link href="/about">About</Link> */}
          <NavBar />
        </nav>

        {/* Right User controls */}
        <section className="user-controls-section flex items-center gap-4">
          <div className="auth-controls flex items-center gap-2">
            <Button variant="ghost" onClick={() => setShowAuthModal(true)}>
              Log in
            </Button>
            <Button onClick={() => setShowAuthModal(true)}>Sign up</Button>
            {false && ( // TODO: Show when user is logged in
              <Button variant="ghost" onClick={() => console.log("Logout clicked")}>
                Logout
              </Button>
            )}
            <div className="profile-controls flex items-center gap-2 border-l pl-2">
              <Button variant="ghost" size="icon" onClick={handleProfileClick}>
                <UserCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <ModeToggle />
        </section>
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
  );
}
