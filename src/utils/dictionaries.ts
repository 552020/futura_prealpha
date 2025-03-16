import "server-only";
import { locales } from "@/middleware";

/**
 * Dictionary type definition for internationalization.
 *
 * NOTE: All fields are intentionally marked as optional to provide flexibility
 * during development. This allows us to:
 * 1. Add new UI elements without immediately updating all language dictionaries
 * 2. Provide fallback values in components when translations are missing
 * 3. Gradually translate content without breaking the application
 *
 * Once the application structure stabilizes, we may consider making critical
 * fields required, but for now, this approach offers the best balance of
 * development speed and reliability.
 */

// Base dictionary type for common UI elements
export type BaseDictionary = {
  metadata?: {
    title?: string;
    description?: string;
  };
  hero?: {
    title?: string;
    subtitle?: string;
    learnMore?: string;
    startHere?: string;
  };
  header?: {
    signIn?: string;
  };
  nav?: {
    about?: string;
    profile?: string;
    settings?: string;
    getStarted?: string;
    faq?: string;
    vault?: string;
    feed?: string;
  };
  footer?: {
    tagline?: string;
    contact?: string;
    terms?: string;
    privacy?: string;
    share?: string;
  };
  onboarding?: {
    upload?: {
      title?: string;
      subtitle?: string;
    };
    profile?: {
      title?: string;
      subtitle?: string;
    };
  };
};

// Value journey dictionary type for segment-specific content
export type ValueJourneyDictionary = {
  valueJourney?: {
    scene1?: {
      image?: string;
      title?: string;
      subtitle?: string;
      description?: string;
    };
    scene2?: {
      image?: string;
      title?: string;
      subtitle?: string;
      description?: string;
    };
    scene3?: {
      image?: string;
      title?: string;
      subtitle?: string;
      description?: string;
    };
    scene4?: {
      image?: string;
      title?: string;
      subtitle?: string;
      description?: string;
    };
    scene5?: {
      image?: string;
      title?: string;
      subtitle?: string;
      description?: string;
    };
    scene6?: {
      image?: string;
      title?: string;
      subtitle?: string;
      description?: string;
    };
    conclusion?: string;
  };
};

// Combined dictionary type that includes both base and value journey content
export type Dictionary = BaseDictionary & ValueJourneyDictionary;

const dictionaries: Record<string, () => Promise<BaseDictionary>> = {
  en: () => import("../app/[lang]/dictionaries/base/en.json").then((module) => module.default),
  fr: () => import("../app/[lang]/dictionaries/base/fr.json").then((module) => module.default),
  es: () => import("../app/[lang]/dictionaries/base/es.json").then((module) => module.default),
  pt: () => import("../app/[lang]/dictionaries/base/pt.json").then((module) => module.default),
  it: () => import("../app/[lang]/dictionaries/base/it.json").then((module) => module.default),
  de: () => import("../app/[lang]/dictionaries/base/de.json").then((module) => module.default),
  pl: () => import("../app/[lang]/dictionaries/base/pl.json").then((module) => module.default),
  zh: () => import("../app/[lang]/dictionaries/base/zh.json").then((module) => module.default),
};

// Segment-specific dictionaries
const segmentDictionaries: Record<string, Record<string, () => Promise<ValueJourneyDictionary>>> = {
  family: {
    en: () => import("../app/[lang]/dictionaries/segments/family/en.json").then((module) => module.default),
    de: () => import("../app/[lang]/dictionaries/segments/family/de.json").then((module) => module.default),
    // Add other languages as needed
  },
  "black-mirror": {
    en: () => import("../app/[lang]/dictionaries/segments/black-mirror/en.json").then((module) => module.default),
    de: () => import("../app/[lang]/dictionaries/segments/black-mirror/de.json").then((module) => module.default),
    // Add other languages as needed
  },
  // Add other segments as needed
};

/**
 * Loads dictionary content for internationalization based on locale and optional segment.
 *
 * This function serves two main purposes:
 * 1. Provides base UI text (navigation, buttons, common elements) for all pages
 * 2. Optionally loads segment-specific content (like valueJourney) when needed
 *
 * The segment parameter is optional because:
 * - Not all pages need segment-specific content
 * - This allows for more efficient loading (only load what's needed)
 * - Some pages (like settings, profile) only need the base dictionary
 * - Content-heavy pages (home, landing pages) need both base and segment content
 *
 * Usage examples:
 * - getDictionary("en") -> Returns just the base dictionary
 * - getDictionary("fr", "family") -> Returns base + family segment content in French
 * - getDictionary("de", "black-mirror") -> Returns base + black-mirror segment in German
 *
 * @param locale - The language code (e.g., "en", "fr", "de")
 * @param segment - Optional segment name (e.g., "family", "black-mirror")
 * @returns A Promise resolving to a Dictionary containing all requested content
 */
export const getDictionary = async (locale: string, segment?: string): Promise<Dictionary> => {
  try {
    // Check if the locale is supported
    if (!locales.includes(locale)) {
      console.warn(`Locale ${locale} not supported, falling back to English`);
      locale = "en";
    }

    // Load the main dictionary for the locale
    const baseDictionary = await dictionaries[locale]();

    // If a segment is specified, try to load and merge the segment-specific dictionary
    if (segment) {
      try {
        // Check if we have a segment dictionary for this locale
        if (segmentDictionaries[segment]?.[locale]) {
          const segmentDict = await segmentDictionaries[segment][locale]();
          // Merge the segment dictionary with the base dictionary
          return { ...baseDictionary, ...segmentDict };
        }
        // Fall back to English segment dictionary if available
        else if (segmentDictionaries[segment]?.en) {
          const segmentDict = await segmentDictionaries[segment].en();
          // Merge the English segment dictionary with the base dictionary
          return { ...baseDictionary, ...segmentDict };
        }
      } catch (error) {
        console.error(`Error loading segment dictionary for ${segment}:`, error);
        // Continue with just the base dictionary if there's an error
      }
    }

    // Return the base dictionary if no segment is specified or if loading the segment dictionary failed
    return baseDictionary;
  } catch (error) {
    console.error(`Error loading dictionary for locale: ${locale}${segment ? `, segment: ${segment}` : ""}`, error);
    // Fallback to English if there's an error with the base dictionary
    return await dictionaries.en();
  }
};
