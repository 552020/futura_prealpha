"use client";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { useSession } from "next-auth/react";
import { User } from "lucide-react";
import AuthModal from "./auth-modal";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();

  const handleUserClick = () => {
    if (session) {
      router.push("/profile");
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-10 border-b bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center">
                <span className="text-2xl font-bold text-white dark:text-black">F</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUserClick}
                aria-label={session ? "Go to profile" : "Sign in"}
              >
                <User className="h-5 w-5" />
              </Button>
              <ModeToggle />
            </div>
          </div>
        </div>
      </nav>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
