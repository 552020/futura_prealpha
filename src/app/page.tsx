"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useInterface } from "@/contexts/interface-context";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const { setMode } = useInterface();

  useEffect(() => {
    if (session?.user) {
      setMode("app");
    } else {
      setMode("marketing");
    }
  }, [session, setMode]);

  // Add loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  // Logged in view
  if (session?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-4xl font-bold mb-4">Welcome, {session.user.name || "User"}</h1>
        <p className="text-neutral-600 dark:text-neutral-400">Your digital memories are secure and ready to explore.</p>
        <Button asChild className="mt-8">
          <Link href={`/user/${session.user.id}/vault`}>Go to Vault</Link>
        </Button>
      </div>
    );
  }

  // Non-logged in view (your existing landing page)
  return (
    <div className="relative h-screen w-full overflow-hidden">
      <Image src="/hero/abstract-1.jpg" alt="Futura" fill className="absolute object-cover -z-10" priority />
      <div className="absolute inset-0 bg-black/10 dark:bg-black/40 -z-10" />
      <div className="flex flex-col items-center justify-center h-full text-white px-4 sm:px-8">
        <h1 className="text-6xl sm:text-8xl lg:text-9xl font-bold tracking-[.15em] text-white dark:text-white">
          Futura
        </h1>
        <h3 className="text-3xl sm:text-5xl lg:text-6xl mt-4 text-white/90 dark:text-white/90">Live Forever. Now.</h3>
        <div className="mt-8 space-x-4">
          <Button asChild className="bg-black text-white hover:bg-white hover:text-black">
            <Link href="#learn-more">Learn More</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-white text-black hover:bg-black hover:text-white hover:border-black"
          >
            <Link href="/onboarding/items-upload">Start Here</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
