import Link from "next/link";

// Define a proper type for the footer dictionary
type FooterDictionary = {
  footer: {
    contact: string;
    about: string;
    social: string;
    tagline: string;
  };
};

export default function Footer({ dict, lang }: { dict?: FooterDictionary; lang?: string }) {
  // Use the passed lang prop if available, otherwise default to "en"
  const currentLang = lang || "en";

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4">
        <div className="flex flex-col items-center gap-2 sm:gap-4">
          {/* Links */}
          <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
            <Link href={`/${currentLang}/contact`} className="hover:text-gray-900 dark:hover:text-gray-300 py-1">
              {dict?.footer?.contact || "Contact"}
            </Link>
            <Link href={`/${currentLang}/about`} className="hover:text-gray-900 dark:hover:text-gray-300 py-1">
              {dict?.footer?.about || "About"}
            </Link>
            <a
              href="https://x.com/futura"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 dark:hover:text-gray-300 py-1"
            >
              {dict?.footer?.social || "X"}
            </a>
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
