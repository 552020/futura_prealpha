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
  home?: {
    title?: string;
    subtitle?: string;
    learnMore?: string;
    startHere?: string;
  };
  valueJourney?: {
    scene1?: {
      title?: string;
      description?: string;
    };
    scene2?: {
      title?: string;
      description?: string;
    };
    scene3?: {
      title?: string;
      description?: string;
    };
    scene4?: {
      title?: string;
      description?: string;
    };
    scene5?: {
      title?: string;
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
  en: () => import("./dictionaries/en.json").then((module) => module.default),
  fr: () => import("./dictionaries/fr.json").then((module) => module.default),
  es: () => import("./dictionaries/es.json").then((module) => module.default),
  pt: () => import("./dictionaries/pt.json").then((module) => module.default),
  it: () => import("./dictionaries/it.json").then((module) => module.default),
  de: () => import("./dictionaries/de.json").then((module) => module.default),
  pl: () => import("./dictionaries/pl.json").then((module) => module.default),
  zh: () => import("./dictionaries/zh.json").then((module) => module.default),
};

export const getDictionary = async (locale: string): Promise<Dictionary> => {
  try {
    // Check if the locale is supported
    if (!locales.includes(locale)) {
      console.warn(`Locale ${locale} not supported, falling back to English`);
      locale = "en";
    }

    return await dictionaries[locale]();
  } catch (error) {
    console.error(`Error loading dictionary for locale: ${locale}`, error);
    // Fallback to English if there's an error
    return await dictionaries.en();
  }
};
