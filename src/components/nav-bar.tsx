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

export default function NavBar({ lang, dict, className }: NavBarProps) {
  const pathname = usePathname();

  return <></>;
}
