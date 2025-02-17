import Link from "next/link";

interface NavbarProps {
  mode: "marketing" | "app";
}

export function NavBar({ mode }: NavbarProps) {
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Check this out!",
          url: window.location.href,
        })
        .then(() => console.log("Share successful"))
        .catch((error) => console.error("Error sharing:", error));
    } else {
      console.log("Web Share API is not supported in your browser.");
    }
  };

  return mode === "marketing" ? (
    // Marketing navigation items
    <>
      <Link href="/about">About</Link>
      <Link href="/pricing">Pricing</Link>
      <button onClick={handleShare}>Share</button>
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
