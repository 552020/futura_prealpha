"use client";

import Link from "next/link";
import { Dictionary } from "@/utils/dictionaries";
import { validateTranslations } from "@/components/utils/translation-validation";

interface HeroProps {
  dict: Dictionary;
  lang: string;
}

function Hero({ dict, lang }: HeroProps) {
  const currentLang = lang || "en";

  // Validate translations using the helper function
  validateTranslations(dict, currentLang, "hero");

  return (
    <div className="w-full flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 flex flex-col bg-background rounded-lg relative">
        {/* Title container */}
        <div className="pt-32">
          <h1
            className="text-center font-black font-bold leading-none text-foreground"
            style={{ fontSize: `calc(147vw / ${(dict?.hero?.title || "Futura").length})` }}
          >
            {dict?.hero?.title || "Futura"}
          </h1>
        </div>

        {/* Subtitle container */}
        <div className="pb-15">
          <p
            className="text-center font-normal text-foreground"
            style={{ fontSize: `calc(160vw / ${(dict?.hero?.subtitle || "Live Forever. Now!").length})` }}
          >
            {dict?.hero?.subtitle || "Live Forever. Now!"}
          </p>
        </div>

        {/* Arrow button */}
        <div className="flex justify-center md:absolute md:top-10 md:right-10 z-10 mt-8 md:mt-0">
          <div className="relative">
            <div className="absolute -inset-1 w-[104px] h-[104px] rounded-full bg-foreground animate-pulse-scale" />
            <Link
              href={`/${currentLang}/onboarding/items-upload`}
              className="relative w-24 h-24 rounded-full bg-foreground hover:bg-background flex items-center justify-center cursor-pointer text-background hover:text-foreground border-2 border-transparent hover:border-foreground transition-all text-4xl font-bold"
              aria-label={dict?.hero?.startNow || "Start Now"}
            >
              {dict?.hero?.arrowSymbol || "→"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
