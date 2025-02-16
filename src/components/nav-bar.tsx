import Link from "next/link";

interface NavbarProps {
  mode: "marketing" | "app";
}

export function NavBar({ mode }: NavbarProps) {
  return mode === "marketing" ? (
    // Marketing navigation items
    <>
      <Link href="/about">About</Link>
      <Link href="/pricing">Pricing</Link>
    </>
  ) : (
    // App navigation items
    <>
      <Link href="/home">Home</Link>
      <Link href="/vault">Vault</Link>
      <Link href="/feed">Feed</Link>
    </>
  );
}
