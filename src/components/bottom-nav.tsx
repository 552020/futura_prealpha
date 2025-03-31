"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useInterface } from "@/contexts/interface-context";
import { allNavItems, getTranslatedLabel } from "@/utils/navigation";
import { Dictionary } from "@/utils/dictionaries";

interface BottomNavProps {
  dict: Dictionary;
}

export default function BottomNav({ dict }: BottomNavProps) {
  const pathname = usePathname();
  const { mode } = useInterface();

  console.log("BottomNav Debug:", {
    pathname,
    mode,
    isVisible: mode !== "marketing",
  });

  // Don't render bottom nav in marketing mode
  if (mode === "marketing") {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm dark:bg-slate-950/80 border-t border-gray-200 dark:border-gray-800 md:hidden"
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex justify-around items-center h-16">
        {allNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={getTranslatedLabel(item, dict)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full text-xs relative",
                isActive ? "text-primary" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
              )}
            >
              {/* Active indicator pill */}
              {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-8 bg-primary rounded-full" />}
              <item.icon className="h-5 w-5 mb-1" />
              <span className="tracking-wide">{getTranslatedLabel(item, dict)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
