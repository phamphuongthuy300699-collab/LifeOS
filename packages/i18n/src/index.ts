import ru from './locales/ru';
import en from './locales/en';
import type { LocaleCode, TranslationDict, TranslationKey } from './types';

export type { LocaleCode, TranslationDict, TranslationKey };

const dictionaries: Record<LocaleCode, TranslationDict> = { ru, en };

/**
 * Get the full dictionary for a locale.
 */
export function getDictionary(locale: LocaleCode): TranslationDict {
  return dictionaries[locale] ?? dictionaries.ru;
}

/**
 * Get a single translation by dot-path key.
 * Falls back to Russian if key is missing in target locale.
 */
export function t(locale: LocaleCode, key: TranslationKey): string {
  const dict = getDictionary(locale);
  const parts = key.split('.');

  let result: unknown = dict;
  for (const part of parts) {
    if (result && typeof result === 'object' && part in result) {
      result = (result as Record<string, unknown>)[part];
    } else {
      // Fallback to Russian
      let fallback: unknown = dictionaries.ru;
      for (const p of parts) {
        if (fallback && typeof fallback === 'object' && p in fallback) {
          fallback = (fallback as Record<string, unknown>)[p];
        } else {
          return key; // Key not found anywhere — return key itself
        }
      }
      return typeof fallback === 'string' ? fallback : key;
    }
  }

  return typeof result === 'string' ? result : key;
}

export const defaultLocale: LocaleCode = 'ru';
export const supportedLocales: LocaleCode[] = ['ru', 'en'];
