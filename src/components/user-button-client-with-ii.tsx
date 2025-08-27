"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SignOut } from "./auth-components";
import Link from "next/link";
// Removed tooltip to avoid click interception; using native title on button instead
import { useRouter, useSearchParams } from "next/navigation";

export default function UserButtonClient({ lang = "en" }: { lang?: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  if (status === "loading") {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full" disabled>
        Loading...
      </Button>
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    const existingCallback = searchParams?.get("callbackUrl");
    const dest = existingCallback
      ? `/${lang}/signin?callbackUrl=${encodeURIComponent(existingCallback)}`
      : `/${lang}/signin`;
    return (
      <Button variant="ghost" onClick={() => router.push(dest)}>
        Sign In
      </Button>
    );
  }

  const principal = (session.user as any).icpPrincipal as string | undefined;
  const name =
    session.user.name ||
    session.user.email ||
    (principal ? `Principal ${principal.slice(0, 8)}…${principal.slice(-6)}` : "User");
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full hover:bg-muted dark:hover:bg-muted dark:hover:text-white"
          title={principal ? `Principal: ${principal}` : name}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={
                session.user.image ||
                `https://api.dicebear.com/9.x/thumbs/svg?seed=${Math.floor(
                  Math.random() * 100000 + 1
                )}&randomizeIds=true`
              }
              alt={name}
            />
            <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal border-b pb-3">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            {session.user.email && <p className="text-muted-foreground text-xs leading-none">{session.user.email}</p>}
            {principal && <p className="text-muted-foreground text-xs leading-none break-all">{principal}</p>}
          </div>
        </DropdownMenuLabel>
        <div className="p-2">
          <DropdownMenuItem asChild>
            <Link
              href={`/${lang}/user/${session.user.id}/profile`}
              className="w-full flex items-center justify-center py-2 cursor-pointer hover:bg-muted focus:bg-muted"
            >
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer hover:bg-muted focus:bg-muted py-2 text-red-600 dark:text-red-400">
            <SignOut />
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
