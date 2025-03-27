import { Dictionary } from "@/utils/dictionaries";

export function validateTranslations(dict: Dictionary, lang: string, component: string) {
  if (process.env.NODE_ENV === "development") {
    const translations = dict?.[component];
    if (!translations) {
      console.warn(`[i18n] Missing translations for component "${component}" in locale "${lang}"`);
      return;
    }

    Object.entries(translations).forEach(([key, value]) => {
      if (!value) {
        console.warn(`[i18n] Missing translation for "${component}.${key}" in locale "${lang}"`);
      }
    });
  }
}
