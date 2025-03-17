"use client";

import Link from "next/link";
import { Dictionary } from "@/utils/dictionaries";
import { Share2, Twitter, Instagram, Facebook } from "lucide-react";

export default function Footer({ dict, lang }: { dict?: Dictionary; lang?: string }) {
  // Use the passed lang prop if available, otherwise default to "en"
  const currentLang = lang || "en";

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Futura",
          text: "Check out Futura - Live Forever. Now.",
          url: window.location.href,
        });
        console.log("Content shared successfully");
      } else {
        // Fallback for browsers that don't support the Web Share API
        console.log("Web Share API not supported");
        // You could show a modal with share options or copy to clipboard here
      }
    } catch (error) {
      // Check if it's an AbortError (user canceled)
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Share was canceled by the user");
        // This is not an error condition, just a user choice
        return;
      }

      // Handle other errors
      console.error("Error sharing content:", error);
      // You might want to show a user-friendly error message here
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
