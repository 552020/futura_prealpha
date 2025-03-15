"use client";

import Link from "next/link";
import { Dictionary } from "@/app/[lang]/dictionaries";
import { Share2, Twitter, Instagram, Facebook } from "lucide-react";
// import { Button } from "./ui/button";

// Define a proper type for the footer dictionary
// type FooterDictionary = {
//   footer: {
//     contact: string;
//     terms: string;
//     privacy: string;
//     tagline: string;
//     share: string;
//   };
// };

export default function Footer({ dict, lang }: { dict?: Dictionary; lang?: string }) {
  // Use the passed lang prop if available, otherwise default to "en"
  const currentLang = lang || "en";

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Futura - Live Forever",
          url: window.location.href,
        })
        .then(() => console.log("Share successful"))
        .catch((error) => console.error("Error sharing:", error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => alert("Link copied to clipboard!"))
        .catch((error) => console.error("Error copying to clipboard:", error));
    }
  };

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4">
        <div className="flex flex-col items-center gap-2 sm:gap-4">
          {/* Links */}
          <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
            {/* Legal and Contact Links */}
            <Link href={`/${currentLang}/terms`} className="hover:text-gray-900 dark:hover:text-gray-300 py-1">
              {dict?.footer?.terms || "Terms"}
            </Link>
            <Link href={`/${currentLang}/privacy`} className="hover:text-gray-900 dark:hover:text-gray-300 py-1">
              {dict?.footer?.privacy || "Privacy"}
            </Link>
            <Link href={`/${currentLang}/contact`} className="hover:text-gray-900 dark:hover:text-gray-300 py-1">
              {dict?.footer?.contact || "Contact"}
            </Link>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-300 py-1"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{dict?.footer?.share || "Share"}</span>
            </button>

            {/* Social Media Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com/futura"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 dark:hover:text-gray-300"
                aria-label="Twitter"
              >
                <Twitter className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://instagram.com/futura"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 dark:hover:text-gray-300"
                aria-label="Instagram"
              >
                <Instagram className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://facebook.com/futura"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 dark:hover:text-gray-300"
                aria-label="Facebook"
              >
                <Facebook className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Tagline - hidden on mobile */}
          <p className="hidden sm:block text-xs sm:text-sm text-gray-500">
            {dict?.footer?.tagline || "Made with ❤️ between Berlin, Marseille and Lisbon"}
          </p>
        </div>
      </div>
    </footer>
  );
}
