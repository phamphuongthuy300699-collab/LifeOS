import type ru from './locales/ru';

/**
 * Translation dictionary structural type.
 * Derived from Russian locale (source of truth) but with string values
 * rather than literal types, so other locales can have different text.
 */
export type TranslationDict = DeepStringify<typeof ru>;

/** Recursively convert all leaf values to `string` */
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends Record<string, unknown>
    ? DeepStringify<T[K]>
    : string;
};

/**
 * Supported locale codes.
 */
export type LocaleCode = 'ru' | 'en';

/**
 * Flatten nested object keys into dot-notation paths.
 * e.g. { nav: { today: '...' } } → 'nav.today'
 */
export type FlattenKeys<T, Prefix extends string = ''> = T extends Record<
  string,
  unknown
>
  ? {
      [K in keyof T & string]: T[K] extends Record<string, unknown>
        ? FlattenKeys<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

export type TranslationKey = FlattenKeys<TranslationDict>;
