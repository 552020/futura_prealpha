"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useInterface } from "@/contexts/interface-context";
import UserButtonClient from "./user-button-client";
import { mainNavItems, secondaryNavItems, getTranslatedLabel } from "@/utils/navigation";
import { Dictionary } from "@/utils/dictionaries";

interface SidebarProps {
  dict: Dictionary;
}

export default function Sidebar({ dict }: SidebarProps) {
  const pathname = usePathname();
  const { mode } = useInterface();

  // Don't render sidebar in marketing mode
  if (mode === "marketing") {
    return null;
  }

  return (
    <aside
      className="fixed left-0 top-16 bottom-0 w-56 bg-white/80 backdrop-blur-sm dark:bg-slate-950/80 border-r border-gray-200 dark:border-gray-800 hidden md:flex flex-col"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Scrollable navigation area */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Main navigation items */}
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={getTranslatedLabel(item, dict)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm relative",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {/* Active indicator bar */}
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 rounded-r-full transition-colors",
                    isActive ? "bg-primary" : "bg-transparent"
                  )}
                />
                <item.icon className="h-5 w-5" />
                <span>{getTranslatedLabel(item, dict)}</span>
              </Link>
            );
          })}
        </div>

        {/* Secondary navigation items */}
        <div className="mt-6 space-y-1">
          {secondaryNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={getTranslatedLabel(item, dict)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm relative",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {/* Active indicator bar */}
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 rounded-r-full transition-colors",
                    isActive ? "bg-primary" : "bg-transparent"
                  )}
                />
                <item.icon className="h-5 w-5" />
                <span>{getTranslatedLabel(item, dict)}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User section at the bottom */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <UserButtonClient />
      </div>
    </aside>
  );
}
