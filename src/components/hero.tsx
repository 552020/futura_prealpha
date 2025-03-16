"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Dictionary } from "@/app/[lang]/dictionaries/dictionaries";

interface HeroProps {
  dict: Dictionary;
  lang: string;
  segment: string;
}

const Hero: React.FC<HeroProps> = ({ dict, lang }) => {
  // Use the passed lang prop if available, otherwise default to "en"
  const currentLang = lang || "en";

  // Check for missing translations and log warnings in development
  if (process.env.NODE_ENV === "development") {
    if (!dict?.hero?.title) {
      console.warn(`[i18n] Missing translation for "home.title" in locale "${currentLang}". Using fallback: "Futura"`);
    }
    if (!dict?.hero?.subtitle) {
      console.warn(
        `[i18n] Missing translation for "home.subtitle" in locale "${currentLang}". Using fallback: "Live Forever. Now."`
      );
    }
    if (!dict?.hero?.learnMore) {
      console.warn(
        `[i18n] Missing translation for "home.learnMore" in locale "${currentLang}". Using fallback: "Learn More"`
      );
    }
    if (!dict?.hero?.startHere) {
      console.warn(
        `[i18n] Missing translation for "home.startHere" in locale "${currentLang}". Using fallback: "Start Here"`
      );
    }
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <Image src="/hero/abstract-1.jpg" alt="Futura" fill className="absolute object-cover -z-10" priority />
      <div className="absolute inset-0 bg-black/10 dark:bg-black/40 -z-10" />
      <div className="flex flex-col items-center justify-center h-full text-white px-4 sm:px-8">
        <h1 className="text-6xl sm:text-8xl lg:text-9xl font-bold tracking-[.15em] text-white dark:text-white">
          {dict?.hero?.title || "Futura"}
        </h1>
        <h3 className="text-3xl sm:text-5xl lg:text-6xl mt-4 text-white/90 dark:text-white/90">
          {dict?.hero?.subtitle || "Live Forever. Now."}
        </h3>
        <div className="mt-8 space-x-4">
          <Button asChild className="bg-black text-white hover:bg-white hover:text-black">
            <Link href={`/${currentLang}#learn-more`}>{dict?.hero?.learnMore || "Learn More"}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-white text-black hover:bg-black hover:text-white hover:border-black"
          >
            <Link href={`/${currentLang}/onboarding/items-upload`}>{dict?.hero?.startHere || "Start Here"}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
