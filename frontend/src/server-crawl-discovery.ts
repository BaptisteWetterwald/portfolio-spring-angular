import { SupportedLocale, supportedLocales } from './app/core/i18n/locales';
import {
  localizedPortfolioPath,
  localizedProjectDetailPath,
} from './app/core/routing/localized-routes';
import { createBackendRequestUrl, parseBackendInternalOrigin } from './server-api-proxy';

const productionOrigin = 'https://bwetterwald.fr';
const publicProjectsPath = '/api/v1/projects';
const projectSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const sitemapBackendRequestTimeoutMs = 5_000;

type FetchBackend = (input: URL, init?: RequestInit) => Promise<Response>;

interface CrawlProjectSummary {
  readonly slug: string;
  readonly status: 'PUBLISHED' | 'ARCHIVED';
  readonly presentationMode: 'DETAIL';
}

interface SitemapEntry {
  readonly location: string;
  readonly alternates: ReadonlyMap<string, string>;
}

export async function loadSitemapXml(
  backendInternalOrigin: string | undefined,
  fetchBackend: FetchBackend = fetch,
  requestTimeoutMs = sitemapBackendRequestTimeoutMs,
): Promise<string> {
  const backendOrigin = parseBackendInternalOrigin(backendInternalOrigin);

  if (!backendOrigin) {
    throw new SitemapUnavailableError('The backend origin is not configured.');
  }

  const projectsByLocale = new Map(
    await Promise.all(
      supportedLocales.map(
        async (locale) =>
          [
            locale,
            await loadCrawlProjects(backendOrigin, locale, fetchBackend, requestTimeoutMs),
          ] as const,
      ),
    ),
  );

  return createSitemapXml(projectsByLocale);
}

export function createSitemapXml(
  projectsByLocale: ReadonlyMap<SupportedLocale, readonly unknown[]>,
): string {
  const entries: SitemapEntry[] = [];
  const mainAlternates = new Map<string, string>(
    supportedLocales.map((locale) => [locale, absoluteUrl(localizedPortfolioPath(locale))]),
  );

  mainAlternates.set('x-default', `${productionOrigin}/`);

  for (const locale of supportedLocales) {
    entries.push({
      location: absoluteUrl(localizedPortfolioPath(locale)),
      alternates: mainAlternates,
    });
  }

  const localesBySlug = collectProjectLocales(projectsByLocale);

  for (const [slug, locales] of localesBySlug) {
    const alternates = new Map<string, string>();

    for (const locale of supportedLocales) {
      if (locales.has(locale)) {
        alternates.set(locale, absoluteUrl(localizedProjectDetailPath(locale, slug)));
      }
    }

    for (const locale of supportedLocales) {
      const location = alternates.get(locale);

      if (location) {
        entries.push({ location, alternates });
      }
    }
  }

  const urls = entries.map(toXmlUrl).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

async function loadCrawlProjects(
  backendOrigin: string,
  locale: SupportedLocale,
  fetchBackend: FetchBackend,
  requestTimeoutMs: number,
): Promise<readonly CrawlProjectSummary[]> {
  const requestUrl = createBackendRequestUrl(
    backendOrigin,
    `${publicProjectsPath}?locale=${encodeURIComponent(locale)}`,
  );
  let response: Response;

  try {
    response = await fetchBackend(requestUrl, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
  } catch {
    throw new SitemapUnavailableError('The public project index is unavailable.');
  }

  if (!response.ok) {
    throw new SitemapUnavailableError('The public project index returned an error.');
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new SitemapUnavailableError('The public project index returned invalid JSON.');
  }

  if (!Array.isArray(payload)) {
    throw new SitemapUnavailableError('The public project index returned an invalid payload.');
  }

  return payload.filter(isCrawlProjectSummary);
}

function collectProjectLocales(
  projectsByLocale: ReadonlyMap<SupportedLocale, readonly unknown[]>,
): ReadonlyMap<string, ReadonlySet<SupportedLocale>> {
  const localesBySlug = new Map<string, Set<SupportedLocale>>();

  for (const locale of supportedLocales) {
    for (const project of projectsByLocale.get(locale) ?? []) {
      if (!isCrawlProjectSummary(project)) {
        continue;
      }

      const locales = localesBySlug.get(project.slug) ?? new Set<SupportedLocale>();

      locales.add(locale);
      localesBySlug.set(project.slug, locales);
    }
  }

  return localesBySlug;
}

function isCrawlProjectSummary(value: unknown): value is CrawlProjectSummary {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value['slug'] === 'string' &&
    projectSlugPattern.test(value['slug']) &&
    (value['status'] === 'PUBLISHED' || value['status'] === 'ARCHIVED') &&
    value['presentationMode'] === 'DETAIL'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function absoluteUrl(path: string): string {
  return `${productionOrigin}${path}`;
}

function toXmlUrl(entry: SitemapEntry): string {
  const alternates = [...entry.alternates]
    .map(
      ([locale, href]) =>
        `    <xhtml:link rel="alternate" hreflang="${escapeXml(locale)}" href="${escapeXml(href)}" />`,
    )
    .join('\n');

  return `  <url>
    <loc>${escapeXml(entry.location)}</loc>
${alternates}
  </url>`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export class SitemapUnavailableError extends Error {}
