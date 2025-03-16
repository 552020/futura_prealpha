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
export type Dictionary = {
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

const dictionaries: Record<string, () => Promise<Dictionary>> = {
  en: () => import("./en.json").then((module) => module.default),
  fr: () => import("./fr.json").then((module) => module.default),
  es: () => import("./es.json").then((module) => module.default),
  pt: () => import("./pt.json").then((module) => module.default),
  it: () => import("./it.json").then((module) => module.default),
  de: () => import("./de.json").then((module) => module.default),
  pl: () => import("./pl.json").then((module) => module.default),
  zh: () => import("./zh.json").then((module) => module.default),
};

// Segment-specific dictionaries
const segmentDictionaries: Record<string, Record<string, () => Promise<Dictionary>>> = {
  family: {
    en: () => import("./family/en.json").then((module) => module.default),
    de: () => import("./family/de.json").then((module) => module.default),
    // Add other languages as needed
  },
  "black-mirror": {
    en: () => import("./black-mirror/en.json").then((module) => module.default),
    de: () => import("./black-mirror/de.json").then((module) => module.default),
    // Add other languages as needed
  },
  // Add other segments as needed
};

export const getDictionary = async (locale: string, segment?: string): Promise<Dictionary> => {
  try {
    // Check if the locale is supported
    if (!locales.includes(locale)) {
      console.warn(`Locale ${locale} not supported, falling back to English`);
      locale = "en";
    }

    // If a segment is specified, try to load the segment-specific dictionary
    if (segment && segmentDictionaries[segment]?.[locale]) {
      return await segmentDictionaries[segment][locale]();
    }

    // Otherwise, load the main dictionary
    return await dictionaries[locale]();
  } catch (error) {
    console.error(`Error loading dictionary for locale: ${locale}${segment ? `, segment: ${segment}` : ""}`, error);
    // Fallback to English if there's an error
    if (segment && segmentDictionaries[segment]?.en) {
      return await segmentDictionaries[segment].en();
    }
    return await dictionaries.en();
  }
};
