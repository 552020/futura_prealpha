import Link from "next/link";

type NavBarDictionary = {
  nav: {
    home: string;
    about: string;
    profile: string;
    settings: string;
    [key: string]: string;
  };
  [key: string]: any;
};

export function NavBar({ mode, lang = "en", dict }: { mode: string; lang: string; dict?: NavBarDictionary }) {
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
      <Link href={`/${lang}`} className="hover:text-primary">
        {dict?.nav?.home || "Home"}
      </Link>
      <Link href={`/${lang}/about`} className="hover:text-primary">
        {dict?.nav?.about || "About"}
      </Link>
      <Link href="/pricing">Pricing</Link>
      <button onClick={handleShare}>Share</button>
    </>
  ) : (
    // App navigation items
    <>
      <Link href={`/${lang}`} className="hover:text-primary">
        {dict?.nav?.home || "Home"}
      </Link>
      <Link href={`/${lang}/about`} className="hover:text-primary">
        {dict?.nav?.about || "About"}
      </Link>
      <Link href="/vault">Vault</Link>
      <Link href="/feed">Feed</Link>
    </>
  );
}
