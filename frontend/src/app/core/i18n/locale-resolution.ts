import {
  defaultLocale,
  localeCookieMaxAgeSeconds,
  localeCookieName,
  SupportedLocale,
  toSupportedLocale,
} from './locales';

export interface LocaleResolutionInput {
  readonly storedPreference?: string | null;
  readonly acceptLanguageHeader?: string | readonly string[] | null;
}

interface AcceptLanguageCandidate {
  readonly locale: SupportedLocale;
  readonly quality: number;
  readonly index: number;
}

export function resolvePreferredLocale(input: LocaleResolutionInput): SupportedLocale {
  return (
    toSupportedLocale(input.storedPreference) ??
    selectLocaleFromAcceptLanguage(input.acceptLanguageHeader) ??
    defaultLocale
  );
}

export function selectLocaleFromAcceptLanguage(
  header: string | readonly string[] | null | undefined,
): SupportedLocale | undefined {
  const normalizedHeader = typeof header === 'string' ? header : (header?.join(',') ?? '');

  if (!normalizedHeader.trim()) {
    return undefined;
  }

  const candidates = normalizedHeader
    .split(',')
    .map((entry, index): AcceptLanguageCandidate | undefined => {
      const [rawTag, ...rawParameters] = entry.trim().split(';');
      const locale = languageTagToSupportedLocale(rawTag);
      const quality = parseQuality(rawParameters);

      if (!locale || quality <= 0) {
        return undefined;
      }

      return {
        locale,
        quality,
        index,
      };
    })
    .filter((candidate): candidate is AcceptLanguageCandidate => candidate !== undefined)
    .sort((left, right) => right.quality - left.quality || left.index - right.index);

  return candidates[0]?.locale;
}

export function readLocalePreferenceCookie(
  cookieHeader: string | null | undefined,
): SupportedLocale | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  for (const rawCookie of cookieHeader.split(';')) {
    const separatorIndex = rawCookie.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const name = rawCookie.slice(0, separatorIndex).trim();

    if (name !== localeCookieName) {
      continue;
    }

    return toSupportedLocale(decodeCookieValue(rawCookie.slice(separatorIndex + 1).trim()));
  }

  return undefined;
}

export function serializeLocalePreferenceCookie(locale: SupportedLocale): string {
  return `${localeCookieName}=${encodeURIComponent(locale)}; Path=/; Max-Age=${localeCookieMaxAgeSeconds}; SameSite=Lax`;
}

function languageTagToSupportedLocale(tag: string | undefined): SupportedLocale | undefined {
  if (!tag) {
    return undefined;
  }

  const primarySubtag = tag.trim().toLowerCase().split('-')[0];

  return toSupportedLocale(primarySubtag);
}

function parseQuality(parameters: readonly string[]): number {
  const qualityParameter = parameters.find((parameter) =>
    parameter.trim().toLowerCase().startsWith('q='),
  );

  if (!qualityParameter) {
    return 1;
  }

  const parsedQuality = Number.parseFloat(qualityParameter.split('=')[1] ?? '');

  if (Number.isNaN(parsedQuality)) {
    return 0;
  }

  return Math.min(Math.max(parsedQuality, 0), 1);
}

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
