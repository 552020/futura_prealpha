"use client";

import Link from "next/link";
import Image from "next/image";
import { Dictionary } from "@/utils/dictionaries";
import { validateTranslations } from "@/components/utils/translation-validation";

interface HeroProps {
  dict: Dictionary;
  lang: string;
}

function Hero({ dict, lang }: HeroProps) {
  // Validate translations using the helper function
  validateTranslations(dict, lang, "hero");

  return (
    <div className="w-full flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 flex flex-col lg:flex-row items-center gap-8 lg:gap-12 bg-background rounded-lg relative">
        {/* Left Column - Text Content */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left bg-red-100 dark:bg-red-900/20 p-4 rounded">
          {/* Title */}
          <div className="pt-32 lg:pt-0">
            <h1
              className="font-black font-bold leading-none text-foreground"
              //   style={{ fontSize: `calc(147vw / ${(dict?.hero?.title || "Futura").length})` }}
              style={{ fontSize: `calc(73.5vw / ${(dict?.hero?.title || "Futura").length})` }}
            >
              {dict?.hero?.title || "Futura"}
            </h1>
          </div>

          {/* Subtitle */}
          <div className="pb-15 lg:pb-8">
            <p
              className="font-normal text-foreground"
              style={{ fontSize: `calc(80vw / ${"Your Wedding. Forever.".length})` }}
            >
              Your Wedding. Forever.
            </p>
          </div>
        </div>

        {/* Right Column - Image */}
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-blue-100 dark:bg-blue-900/20 p-4 rounded">
          <div className="relative w-full max-w-md lg:max-w-lg min-h-[300px] lg:min-h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <Image
              src="/hero/abstract-1.jpg"
              alt="Futura Hero Image"
              width={500}
              height={500}
              className="w-full h-full rounded-lg shadow-lg object-cover"
              priority
            />
          </div>
        </div>

        {/* Arrow button - positioned absolutely */}
        <div className="flex justify-center md:absolute md:top-10 md:right-10 z-10">
          <div className="relative">
            <div className="absolute -inset-1 w-[104px] h-[104px] rounded-full bg-neutral-900 dark:bg-white animate-pulse-scale" />
            <Link
              href={`/${lang}/onboarding/items-upload`}
              className="relative w-24 h-24 rounded-full bg-neutral-900 hover:bg-white dark:bg-white dark:hover:bg-neutral-900 flex items-center justify-center cursor-pointer text-white hover:text-neutral-900 dark:text-neutral-900 dark:hover:text-white border-2 border-transparent hover:border-neutral-900 dark:hover:border-white transition-all text-4xl font-bold"
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
