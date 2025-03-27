"use client";

import { Button } from "@/components/ui/button";
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
      <div className="w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 flex flex-col bg-slate-100 rounded-lg">
        {/* Title container */}
        <div className="pt-32 border border-dotted border-blue-400">
          <h1
            className="text-center font-black font-bold leading-none"
            style={{ fontSize: `calc(147vw / ${"Futura".length})` }}
          >
            {dict?.hero?.title || "Futura"}
          </h1>
        </div>

        {/* Subtitle container */}
        <div className="pb-15 border border-dotted border-red-400">
          <p className="text-center font-normal" style={{ fontSize: `calc(160vw / ${"Live Forever. Now!".length})` }}>
            Live Forever. Now!
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
                Now
              </Link>
            </div>
          </div>
        )}
        {/* Arrow button */}
        <div className="flex justify-center mt-4">
          <div className="relative">
            <div className="absolute -inset-1 w-[104px] h-[104px] rounded-full bg-black animate-pulse-scale" />
            <Link
              href={`/${currentLang}/onboarding/items-upload`}
              className="relative w-24 h-24 rounded-full bg-black hover:bg-white dark:bg-white dark:hover:bg-black flex items-center justify-center cursor-pointer text-white hover:text-black dark:text-black dark:hover:text-white border-2 border-transparent hover:border-black dark:hover:border-white transition-all text-4xl font-bold"
            >
              →
            </Link>
          </div>
        </div>
        {/* <div className="flex justify-center mt-4">
          <div className="relative">
            <div className="absolute inset-1 w-[72px] h-[72px] rounded-full bg-black/10 animate-[ping_2s_ease-in-out_infinite]" />
            <Link
              href={`/${currentLang}/onboarding/items-upload`}
              className="relative w-20 h-20 rounded-full bg-black hover:bg-white dark:bg-white dark:hover:bg-black flex items-center justify-center cursor-pointer text-white hover:text-black dark:text-black dark:hover:text-white border-2 border-transparent hover:border-black dark:hover:border-white transition-all"
            >
              Now
            </Link>
          </div>
        </div> */}
      </div>
    </div>
  );
}

export default Hero;
