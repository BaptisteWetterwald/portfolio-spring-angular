import { SupportedLocale, supportedLocales, toSupportedLocale } from '../i18n/locales';

export const localizedStaticRouteSegments = {
  home: {
    fr: '',
    en: '',
  },
  education: {
    fr: 'formation',
    en: 'education',
  },
  experience: {
    fr: 'experience',
    en: 'experience',
  },
  projects: {
    fr: 'projets',
    en: 'projects',
  },
  contact: {
    fr: 'contact',
    en: 'contact',
  },
} as const satisfies Record<string, Record<SupportedLocale, string>>;

export type StaticPageId = keyof typeof localizedStaticRouteSegments;
export type RoutePageId = StaticPageId | 'projectDetail';

export interface LocalizedRouteMatch {
  readonly locale: SupportedLocale;
  readonly pageId: RoutePageId;
  readonly slug?: string;
}

export const staticPageIds = Object.keys(localizedStaticRouteSegments) as StaticPageId[];

export function localizedPath(locale: SupportedLocale, pageId: StaticPageId): string {
  const segment = localizedSegment(locale, pageId);

  return segment ? `/${locale}/${segment}` : `/${locale}`;
}

export function localizedSegment(locale: SupportedLocale, pageId: StaticPageId): string {
  return localizedStaticRouteSegments[pageId][locale];
}

export function localizedProjectDetailPath(locale: SupportedLocale, slug: string): string {
  return `${localizedPath(locale, 'projects')}/${encodeURIComponent(slug)}`;
}

export function localizedProjectDetailAlternates(
  slug: string,
  locales: readonly SupportedLocale[] = supportedLocales,
): Partial<Record<SupportedLocale, string>> {
  return locales.reduce(
    (alternates, locale) => ({
      ...alternates,
      [locale]: localizedProjectDetailPath(locale, slug),
    }),
    {} as Partial<Record<SupportedLocale, string>>,
  );
}

export function equivalentLocalizedPath(
  currentUrl: string,
  targetLocale: SupportedLocale,
  projectDetailAvailableLocales?: readonly SupportedLocale[],
): string {
  const match = matchLocalizedPath(currentUrl);

  if (!match) {
    return localizedPath(targetLocale, 'home');
  }

  if (match.pageId === 'projectDetail') {
    if (projectDetailAvailableLocales && !projectDetailAvailableLocales.includes(targetLocale)) {
      return localizedPath(targetLocale, 'projects');
    }

    return match.slug
      ? localizedProjectDetailPath(targetLocale, match.slug)
      : localizedPath(targetLocale, 'home');
  }

  return localizedPath(targetLocale, match.pageId);
}

export function matchLocalizedPath(url: string): LocalizedRouteMatch | undefined {
  const pathSegments = parsePathSegments(url);
  const locale = toSupportedLocale(pathSegments[0]);

  if (!locale) {
    return undefined;
  }

  const pageSegments = pathSegments.slice(1);

  if (pageSegments.length === 0) {
    return {
      locale,
      pageId: 'home',
    };
  }

  if (pageSegments.length === 1) {
    const pageId = pageIdFromSegment(locale, pageSegments[0]);

    return pageId
      ? {
          locale,
          pageId,
        }
      : undefined;
  }

  if (pageSegments.length === 2 && pageSegments[0] === localizedSegment(locale, 'projects')) {
    return {
      locale,
      pageId: 'projectDetail',
      slug: pageSegments[1],
    };
  }

  return undefined;
}

export function toStaticPageId(value: unknown): StaticPageId | undefined {
  return typeof value === 'string' && staticPageIds.includes(value as StaticPageId)
    ? (value as StaticPageId)
    : undefined;
}

export function localizedAlternates(pageId: StaticPageId): Record<SupportedLocale, string> {
  return supportedLocales.reduce(
    (alternates, locale) => ({
      ...alternates,
      [locale]: localizedPath(locale, pageId),
    }),
    {} as Record<SupportedLocale, string>,
  );
}

function pageIdFromSegment(
  locale: SupportedLocale,
  segment: string | undefined,
): StaticPageId | undefined {
  return staticPageIds.find((pageId) => localizedSegment(locale, pageId) === segment);
}

function parsePathSegments(url: string): string[] {
  const path = url.split(/[?#]/)[0] ?? '';

  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => decodeSegment(segment));
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
