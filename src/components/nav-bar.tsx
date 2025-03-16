import Link from "next/link";
import { Dictionary } from "@/utils/dictionaries";

type NavBarProps = {
  mode?: string;
  lang: string;
  dict?: Dictionary;
  className?: string;
};

export function NavBar({ mode, lang, dict, className }: NavBarProps) {
  // Check if we're in a mobile context (passed via className)
  const isMobile = className?.includes("mobile") || false;

  // Check for missing translations and log warnings in development
  if (process.env.NODE_ENV === "development") {
    if (!dict?.nav?.about) {
      console.warn(`[i18n] Missing translation for "navigation.about" in locale "${lang}". Using fallback: "About"`);
    }
    if (!dict?.nav?.faq) {
      console.warn(`[i18n] Missing translation for "navigation.faq" in locale "${lang}". Using fallback: "FAQ"`);
    }
  }

  return mode === "marketing" ? (
    <>
      <Link
        href={`/${lang}/about`}
        className={`text-sm font-medium transition-colors hover:text-primary ${isMobile ? "py-2 text-base" : ""}`}
      >
        {dict?.nav?.about || "About"}
      </Link>
      <Link
        href={`/${lang}/faq`}
        className={`text-sm font-medium transition-colors hover:text-primary ${isMobile ? "py-2 text-base" : ""}`}
      >
        {dict?.nav?.faq || "FAQ"}
      </Link>
    </>
  ) : (
    // App navigation items
    // TODO: add the about we removed from here in the footer
    <>
      <Link href={`/${lang}/vault`} className="hover:text-primary">
        Vault
      </Link>
      <Link href={`/${lang}/feed`} className="hover:text-primary">
        Feed
      </Link>
    </>
  );
}
