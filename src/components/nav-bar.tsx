import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dictionary } from "@/utils/dictionaries";
import { validateTranslations } from "@/components/utils/translation-validation";
import { cn } from "@/lib/utils";

type NavBarProps = {
  mode: "marketing" | "app";
  lang: string;
  dict: Dictionary;
  className?: string;
};

export default function NavBar({ mode, lang, dict, className }: NavBarProps) {
  const pathname = usePathname();

  // Validate translations
  if (mode === "marketing") {
    validateTranslations(dict, lang, "nav");
  }

  return mode === "marketing" ? (
    <>
      {[
        { href: "/about", label: dict[lang]?.nav?.about || "About" },
        { href: "/journal", label: dict[lang]?.nav?.journal || "Journal" },
        { href: "/merch", label: dict[lang]?.nav?.merch || "Merch" },
        { href: "/faq", label: dict[lang]?.nav?.faq || "FAQ" },
      ].map((item) => (
        <Link
          key={item.href}
          href={`/${lang}${item.href}`}
          className={cn(
            "transition-all duration-200 ease-in-out px-2 py-2",
            "hover:text-primary hover:bg-muted rounded-md",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            className === "mobile" ? "text-lg w-full flex items-center" : "text-sm",
            pathname === `/${lang}${item.href}` ? "font-semibold text-primary bg-muted" : "text-muted-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </>
  ) : (
    <>
      {[
        { href: "/dashboard", label: dict[lang]?.nav?.dashboard || "Dashboard" },
        { href: "/settings", label: dict[lang]?.nav?.settings || "Settings" },
      ].map((item) => (
        <Link
          key={item.href}
          href={`/${lang}${item.href}`}
          className={cn(
            "transition-all duration-200 ease-in-out px-2 py-2",
            "hover:text-primary hover:bg-muted rounded-md",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            className === "mobile" ? "text-lg w-full flex items-center" : "text-sm",
            pathname === `/${lang}${item.href}` ? "font-semibold text-primary bg-muted" : "text-muted-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}
