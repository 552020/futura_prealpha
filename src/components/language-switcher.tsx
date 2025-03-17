"use client";

import { useParams, usePathname } from "next/navigation";
import { locales } from "@/middleware";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useState } from "react";

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
  const [isChanging, setIsChanging] = useState(false);

  // Function to get the new path with the selected language
  const getPathWithNewLocale = (locale: string) => {
    const segments = pathname.split("/");
    segments[1] = locale; // Replace the language segment
    return segments.join("/");
  };

  // Function to handle language change with a full page reload
  const handleLanguageChange = (locale: string) => {
    // console.log("Language change requested:", locale);
    // console.log("Current language:", lang);
    // console.log("Current pathname:", pathname);

    if (locale === lang || isChanging) {
      //   console.log("Early return - same language or already changing");
      return;
    }

    setIsChanging(true);
    // console.log("isChanging set to true");

    // Get the new path
    const newPath = getPathWithNewLocale(locale);
    // console.log("New path constructed:", newPath);

    // Log the current location before changing
    // console.log("Current window.location.href:", window.location.href);

    // Use window.location for a full page reload instead of client-side navigation
    // console.log("About to navigate to:", newPath);
    window.location.href = newPath;

    // This might not execute if the page starts reloading immediately
    // console.log("Navigation initiated");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Globe size={16} />
          <span className="flex items-center gap-2">
            <span className="text-base">{languageInfo[lang]?.flag || "🌐"}</span>
            <span className="hidden sm:inline">{languageInfo[lang]?.name || "Language"}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem key={locale} disabled={isChanging}>
            <button
              onClick={() => handleLanguageChange(locale)}
              className={`flex items-center gap-3 w-full ${locale === lang ? "font-bold" : ""}`}
            >
              <span className="text-base">{languageInfo[locale]?.flag || "🌐"}</span>
              <span>{languageInfo[locale]?.name || locale}</span>
            </button>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
