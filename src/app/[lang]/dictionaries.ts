import "server-only";
import { locales } from "@/middleware";

type Locale = (typeof locales)[number];
type Dictionary = Record<string, any>;

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
