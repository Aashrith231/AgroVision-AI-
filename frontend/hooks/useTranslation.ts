import { Language, translations } from "../i18n/translations";

export function useTranslation(language: Language) {
  return translations[language];
}
