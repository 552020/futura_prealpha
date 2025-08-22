import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dictionary } from "@/utils/dictionaries";
import { cn } from "@/lib/utils";

type NavBarProps = {
  lang: string;
  dict: Dictionary;
  className?: string;
};

type NavItem = {
  href: string;
  label: string;
};

export default function NavBar({ lang, className }: NavBarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = []; // still empty for now

  return (
    <>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={`/${lang}${item.href}`}
          className={cn(
            "transition-all duration-200 ease-in-out px-2 py-2",
            "hover:text-primary hover:bg-muted rounded-md",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            className === "mobile"
              ? "text-lg w-full flex items-center"
              : "text-sm",
            pathname === `/${lang}${item.href}`
              ? "font-semibold text-primary bg-muted"
              : "text-muted-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}
