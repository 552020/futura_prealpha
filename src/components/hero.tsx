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
    <div className="w-full flex items-center justify-center mt-4">
      <div className="w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 flex flex-col bg-white dark:bg-[#0A0A0B] rounded-lg pb-5 relative">
        {/* Title container */}
        <div
          className={`pt-32 ${false ? "border border-dotted border-blue-400" : ""}`}
          // Debug: border border-dotted border-blue-400
        >
          <h1
            className="text-center font-black font-bold leading-none text-neutral-900 dark:text-white"
            style={{ fontSize: `calc(147vw / ${(dict?.hero?.title || "Futura").length})` }}
          >
            {dict?.hero?.title || "Futura"}
          </h1>
        </div>

        {/* Subtitle container */}
        <div
          className={`pb-15 ${false ? "border border-dotted border-red-400" : ""}`}
          // Debug: border border-dotted border-red-400
        >
          <p
            className="text-center font-normal text-neutral-900 dark:text-white"
            style={{ fontSize: `calc(160vw / ${(dict?.hero?.subtitle || "Live Forever. Now!").length})` }}
          >
            {dict?.hero?.subtitle || "Live Forever. Now!"}
          </p>
        </div>

        {/* CTA buttons */}
        {/* <div className="flex gap-4 justify-center pb-10 border border-dotted border-green-400">
          <Button
            asChild
            className="h-12 px-8 rounded-full bg-black text-white hover:bg-white hover:text-black border border-black text-base"
          >
            <Link href={`/${currentLang}#learn-more`}>{dict?.hero?.learnMore || "Learn More"}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 px-8 rounded-full border border-black text-black hover:bg-black hover:text-white text-base"
          >
            <Link href={`/${currentLang}/onboarding/items-upload`}>{dict?.hero?.startHere || "Start Here"}</Link>
          </Button>
        </div> */}

        {false && (
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-1 w-[104px] h-[104px] rounded-full bg-black animate-pulse-scale" />
              <Link
                href={`/${currentLang}/onboarding/items-upload`}
                className="relative w-24 h-24 rounded-full bg-black hover:bg-white dark:bg-white dark:hover:bg-black flex items-center justify-center cursor-pointer text-white hover:text-black dark:text-black dark:hover:text-white border-2 border-transparent hover:border-black dark:hover:border-white transition-all text-xl font-bold"
              >
                {dict?.hero?.now || "Now"}
              </Link>
            </div>
          </div>
        )}

        {/* Arrow button */}
        <div className="flex justify-center md:absolute md:top-10 md:right-10 z-10">
          <div className="relative">
            <div className="absolute -inset-1 w-[104px] h-[104px] rounded-full bg-neutral-900 dark:bg-white animate-pulse-scale" />
            <Link
              href={`/${currentLang}/onboarding/items-upload`}
              className="relative w-24 h-24 rounded-full bg-neutral-900 hover:bg-white dark:bg-white dark:hover:bg-neutral-900 flex items-center justify-center cursor-pointer text-white hover:text-neutral-900 dark:text-neutral-900 dark:hover:text-white border-2 border-transparent hover:border-neutral-900 dark:hover:border-white transition-all text-4xl font-bold"
              aria-label={dict?.hero?.startNow || "Start Now"}
            >
              {dict?.hero?.arrowSymbol || "→"}
            </Link>
          </div>
        </div>

        {false && (
          <div className="flex justify-center mt-4">
            <div className="relative">
              <div className="absolute inset-1 w-[72px] h-[72px] rounded-full bg-black/10 animate-[ping_2s_ease-in-out_infinite]" />
              <Link
                href={`/${currentLang}/onboarding/items-upload`}
                className="relative w-20 h-20 rounded-full bg-black hover:bg-white dark:bg-white dark:hover:bg-black flex items-center justify-center cursor-pointer text-white hover:text-black dark:text-black dark:hover:text-white border-2 border-transparent hover:border-black dark:hover:border-white transition-all"
              >
                {dict?.hero?.now || "Now"}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Hero;
