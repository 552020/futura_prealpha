import Link from "next/link";
import { Dictionary } from "@/app/[lang]/dictionaries";

export function NavBar({ mode, lang = "en", dict }: { mode: string; lang: string; dict?: Dictionary }) {
  // Check for missing translations and log warnings in development
  if (process.env.NODE_ENV === "development") {
    if (!dict?.nav?.about) {
      console.warn(`[i18n] Missing translation for "nav.about" in locale "${lang}". Using fallback: "About"`);
    }
    if (!dict?.nav?.faq) {
      console.warn(`[i18n] Missing translation for "nav.faq" in locale "${lang}". Using fallback: "FAQ"`);
    }
  }

  return mode === "marketing" ? (
    <>
      <Link href={`/${lang}/about`} className="hover:text-primary">
        {dict?.nav?.about || "About"}
      </Link>
      <Link href={`/${lang}/faq`} className="hover:text-primary">
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
