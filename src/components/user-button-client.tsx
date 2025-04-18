"use client";

import { useSession, signIn } from "next-auth/react";
import { Avatar, AvatarImage } from "./ui/avatar";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function UserButtonClient({ lang = "en" }: { lang?: string }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full" disabled>
        Loading...
      </Button>
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    return (
      <Button variant="ghost" onClick={() => signIn()}>
        Sign In
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="hidden text-sm sm:inline-flex cursor-help">{session.user.name}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{session.user.email}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full hover:bg-muted dark:hover:bg-muted dark:hover:text-white"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={
                  session.user.image ||
                  `https://api.dicebear.com/9.x/thumbs/svg?seed=${Math.floor(
                    Math.random() * 100000 + 1
                  )}&randomizeIds=true`
                }
                alt={session.user.name || "Avatar"}
              />
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal border-b pb-3">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{session.user.name}</p>
              <p className="text-muted-foreground text-xs leading-none">{session.user.email}</p>
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
    </div>
  );
}
