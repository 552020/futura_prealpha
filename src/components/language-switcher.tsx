"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { locales } from "@/middleware";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Globe } from "lucide-react";

// Language display names and flags
const languageInfo: Record<string, { name: string; flag: string }> = {
  en: { name: "English", flag: "🇬🇧" },
  fr: { name: "Français", flag: "🇫🇷" },
  es: { name: "Español", flag: "🇪🇸" },
  pt: { name: "Português", flag: "🇵🇹" },
  it: { name: "Italiano", flag: "🇮🇹" },
  de: { name: "Deutsch", flag: "🇩🇪" },
  pl: { name: "Polski", flag: "🇵🇱" },
  zh: { name: "中文", flag: "🇨🇳" },
};

export function LanguageSwitcher() {
  const pathname = usePathname();
  const params = useParams();
  const lang = params.lang as string;

  // Function to get the new path with the selected language
  const getPathWithNewLocale = (locale: string) => {
    const segments = pathname.split("/");
    segments[1] = locale; // Replace the language segment
    return segments.join("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Globe size={16} />
          <span className="flex items-center gap-2">
            <span className="text-base">{languageInfo[lang].flag}</span>
            <span className="hidden sm:inline">{languageInfo[lang].name}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem key={locale} asChild>
            <Link
              href={getPathWithNewLocale(locale)}
              className={`flex items-center gap-3 w-full ${locale === lang ? "font-bold" : ""}`}
            >
              <span className="text-base">{languageInfo[locale].flag}</span>
              <span>{languageInfo[locale].name}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
