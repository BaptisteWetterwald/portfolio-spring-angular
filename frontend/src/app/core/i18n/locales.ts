export const supportedLocales = ['fr', 'en'] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = 'en';
export const localeStorageKey = 'portfolio.locale';
export const localeCookieName = 'portfolio_locale';
export const localeCookieMaxAgeSeconds = 60 * 60 * 24 * 365;

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && supportedLocales.includes(value as SupportedLocale);
}

export function toSupportedLocale(value: unknown): SupportedLocale | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim().toLowerCase();

  return isSupportedLocale(normalizedValue) ? normalizedValue : undefined;
}
