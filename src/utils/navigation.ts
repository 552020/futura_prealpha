import { Vault, Newspaper, Share2, User, Users, LucideIcon } from "lucide-react";
import { Dictionary } from "@/utils/dictionaries";

export type NavItem = {
  href: string;
  icon: LucideIcon; // Lucide icon component
  label: string;
  translationKey: "vault" | "feed" | "shared" | "contacts" | "profile";
};

// Helper function to get translated label
export function getTranslatedLabel(item: NavItem, dict: Dictionary): string {
  return dict.navigation?.[item.translationKey] || item.label;
}

// Group navigation items for better organization
export const mainNavItems: NavItem[] = [
  { href: "/vault", icon: Vault, label: "Vault", translationKey: "vault" },
  { href: "/feed", icon: Newspaper, label: "Feed", translationKey: "feed" },
  { href: "/memories/shared", icon: Share2, label: "Shared", translationKey: "shared" },
];

export const secondaryNavItems: NavItem[] = [
  { href: "/contacts", icon: Users, label: "Contacts", translationKey: "contacts" },
  { href: "/profile", icon: User, label: "Profile", translationKey: "profile" },
];

// Combined array for components that need all items
export const allNavItems: NavItem[] = [...mainNavItems, ...secondaryNavItems];
