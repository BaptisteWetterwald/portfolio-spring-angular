import { DOCUMENT } from '@angular/core';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { portfolioContentFor, portfolioPublicProfile } from '../content/portfolio-content';
import { LocaleContextService } from '../i18n/locale-context.service';
import { isSupportedLocale, SupportedLocale, supportedLocales } from '../i18n/locales';
import { TranslationService } from '../i18n/translation.service';
import { TranslationKey } from '../i18n/translations';
import { absoluteProjectMediaUrl } from '../projects/project-media';
import {
  localizedAlternates,
  localizedPath,
  localizedProjectDetailAlternates,
  localizedProjectDetailPath,
  StaticPageId,
} from '../routing/localized-routes';

const productionOrigin = 'https://bwetterwald.fr';
const managedAttribute = 'data-managed-by';
const managedAttributeValue = 'page-metadata-service';
const xDefaultUrl = `${productionOrigin}/`;
const jsonLdMediaType = 'application/ld+json';

const metadataKeys = {
  home: {
    title: 'metadata.home.title',
    description: 'metadata.home.description',
  },
  education: {
    title: 'metadata.education.title',
    description: 'metadata.education.description',
  },
  experience: {
    title: 'metadata.experience.title',
    description: 'metadata.experience.description',
  },
  projects: {
    title: 'metadata.projects.title',
    description: 'metadata.projects.description',
  },
  contact: {
    title: 'metadata.contact.title',
    description: 'metadata.contact.description',
  },
} as const satisfies Record<StaticPageId, { title: TranslationKey; description: TranslationKey }>;

const ogLocales: Record<SupportedLocale, string> = {
  fr: 'fr_FR',
  en: 'en_US',
};

export interface ProjectPageMetadata {
  readonly slug: string;
  readonly title: string;
  readonly shortDescription: string;
  readonly logoMediaRef?: string | null;
  readonly availableLocales?: readonly string[];
}

interface ProfilePageStructuredData {
  readonly '@context': 'https://schema.org';
  readonly '@type': 'ProfilePage';
  readonly '@id': string;
  readonly url: string;
  readonly inLanguage: SupportedLocale;
  readonly mainEntity: {
    readonly '@type': 'Person';
    readonly '@id': string;
    readonly name: string;
    readonly description: string;
    readonly jobTitle: string;
    readonly image: string;
    readonly sameAs: readonly string[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class PageMetadataService {
  readonly #document = inject(DOCUMENT);
  readonly #localeContext = inject(LocaleContextService);
  readonly #meta = inject(Meta);
  readonly #title = inject(Title);
  readonly #translations = inject(TranslationService);

  applyStaticPage(pageId: StaticPageId, locale: SupportedLocale): void {
    this.#localeContext.setLocale(locale);
    this.#setHtmlLang(locale);

    const metadataKey = metadataKeys[pageId];
    const title = this.#translations.translateFor(locale, metadataKey.title);
    const description = this.#translations.translateFor(locale, metadataKey.description);
    const canonicalUrl = absoluteUrl(localizedPath(locale, pageId));
    const alternates = localizedAlternates(pageId);

    this.#removeManagedLinks();
    this.#applyMetadata({
      title,
      description,
      url: canonicalUrl,
      locale,
      robots: 'index,follow',
      includeOpenGraphAlternateLocales: true,
    });
    this.#setCanonical(canonicalUrl);
    this.#setAlternates(alternates);

    if (pageId === 'home') {
      this.#setProfilePageStructuredData(locale, description);
    } else {
      this.#removeManagedStructuredData();
    }
  }

  applyProjectDetail(locale: SupportedLocale, project: ProjectPageMetadata): void {
    this.#localeContext.setLocale(locale);
    this.#setHtmlLang(locale);

    const title = `${project.title} | Baptiste Wetterwald`;
    const description = project.shortDescription;
    const canonicalUrl = absoluteUrl(localizedProjectDetailPath(locale, project.slug));
    const availableLocales = availableProjectLocales(project.availableLocales, locale);
    const alternates = localizedProjectDetailAlternates(project.slug, availableLocales);

    this.#removeManagedLinks();
    this.#applyMetadata({
      title,
      description,
      url: canonicalUrl,
      locale,
      robots: 'index,follow',
      includeOpenGraphAlternateLocales: true,
      openGraphAlternateLocales: availableLocales.filter(
        (availableLocale) => availableLocale !== locale,
      ),
      openGraphType: 'article',
      imageUrl: absoluteProjectMediaUrl(project.logoMediaRef),
    });
    this.#setCanonical(canonicalUrl);
    this.#setAlternates(alternates, false);
    this.#removeManagedStructuredData();
  }

  applyNotFound(locale: SupportedLocale, currentPath: string): void {
    this.#localeContext.setLocale(locale);
    this.#setHtmlLang(locale);

    const title = this.#translations.translateFor(locale, 'metadata.notFound.title');
    const description = this.#translations.translateFor(locale, 'metadata.notFound.description');

    this.#applyMetadata({
      title,
      description,
      url: absoluteUrl(stripQueryAndFragment(currentPath)),
      locale,
      robots: 'noindex,follow',
      includeOpenGraphAlternateLocales: false,
      openGraphType: 'website',
    });
    this.#removeManagedLinks();
    this.#removeManagedStructuredData();
  }

  applyProjectUnavailable(locale: SupportedLocale, currentPath: string): void {
    this.#localeContext.setLocale(locale);
    this.#setHtmlLang(locale);

    const heading = this.#translations.translateFor(locale, 'projectDetail.error.heading');
    const siteName = this.#translations.translateFor(locale, 'site.name');
    const description = this.#translations.translateFor(locale, 'projectDetail.error.message');

    this.#applyMetadata({
      title: `${heading} | ${siteName}`,
      description,
      url: absoluteUrl(stripQueryAndFragment(currentPath)),
      locale,
      robots: 'noindex,follow',
      includeOpenGraphAlternateLocales: false,
      openGraphType: 'website',
    });
    this.#removeManagedLinks();
    this.#removeManagedStructuredData();
  }

  #setProfilePageStructuredData(locale: SupportedLocale, description: string): void {
    const hero = portfolioContentFor(locale).home.hero;
    const pageUrl = absoluteUrl(localizedPath(locale, 'home'));
    const structuredData: ProfilePageStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      '@id': `${pageUrl}#profile-page`,
      url: pageUrl,
      inLanguage: locale,
      mainEntity: {
        '@type': 'Person',
        '@id': `${productionOrigin}/#person`,
        name: hero.name,
        description,
        jobTitle: hero.role,
        image: absoluteUrl(portfolioPublicProfile.portraitPath),
        sameAs: [...portfolioPublicProfile.sameAs],
      },
    };
    const script = this.#document.createElement('script');

    this.#removeManagedStructuredData();
    script.setAttribute('type', jsonLdMediaType);
    script.setAttribute(managedAttribute, `${managedAttributeValue}:structured-data`);
    script.textContent = serializeJsonLd(structuredData);
    this.#document.head.appendChild(script);
  }

  #applyMetadata(metadata: {
    readonly title: string;
    readonly description: string;
    readonly url: string;
    readonly locale: SupportedLocale;
    readonly robots: string;
    readonly includeOpenGraphAlternateLocales: boolean;
    readonly openGraphAlternateLocales?: readonly SupportedLocale[];
    readonly openGraphType?: 'website' | 'article';
    readonly imageUrl?: string;
  }): void {
    this.#title.setTitle(metadata.title);
    this.#meta.updateTag(
      { name: 'description', content: metadata.description },
      'name="description"',
    );
    this.#meta.updateTag({ name: 'robots', content: metadata.robots }, 'name="robots"');
    this.#meta.updateTag({ property: 'og:title', content: metadata.title }, 'property="og:title"');
    this.#meta.updateTag(
      { property: 'og:description', content: metadata.description },
      'property="og:description"',
    );
    this.#meta.updateTag(
      { property: 'og:type', content: metadata.openGraphType ?? 'website' },
      'property="og:type"',
    );
    this.#meta.updateTag({ property: 'og:url', content: metadata.url }, 'property="og:url"');
    this.#meta.updateTag(
      { property: 'og:locale', content: ogLocales[metadata.locale] },
      'property="og:locale"',
    );
    if (metadata.includeOpenGraphAlternateLocales) {
      this.#setOpenGraphAlternateLocales(
        metadata.openGraphAlternateLocales ??
          supportedLocales.filter((supportedLocale) => supportedLocale !== metadata.locale),
      );
    } else {
      this.#removeManagedOpenGraphAlternateLocales();
    }
    if (metadata.imageUrl) {
      const imageMeta = this.#meta.updateTag(
        { property: 'og:image', content: metadata.imageUrl },
        'property="og:image"',
      );

      imageMeta?.setAttribute(managedAttribute, `${managedAttributeValue}:og-image`);
    } else {
      this.#removeManagedImage();
    }
  }

  #setCanonical(url: string): void {
    const link = this.#createManagedLink();

    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    this.#document.head.appendChild(link);
  }

  #setAlternates(
    alternates: Partial<Record<SupportedLocale, string>>,
    includeXDefault = true,
  ): void {
    for (const locale of supportedLocales) {
      const alternate = alternates[locale];

      if (!alternate) {
        continue;
      }

      const link = this.#createManagedLink();

      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', locale);
      link.setAttribute('href', absoluteUrl(alternate));
      this.#document.head.appendChild(link);
    }

    if (!includeXDefault) {
      return;
    }

    const defaultLink = this.#createManagedLink();

    defaultLink.setAttribute('rel', 'alternate');
    defaultLink.setAttribute('hreflang', 'x-default');
    defaultLink.setAttribute('href', xDefaultUrl);
    this.#document.head.appendChild(defaultLink);
  }

  #setOpenGraphAlternateLocales(alternateLocales: readonly SupportedLocale[]): void {
    this.#removeManagedOpenGraphAlternateLocales();

    for (const alternateLocale of alternateLocales) {
      const meta = this.#document.createElement('meta');

      meta.setAttribute('property', 'og:locale:alternate');
      meta.setAttribute('content', ogLocales[alternateLocale]);
      meta.setAttribute(managedAttribute, `${managedAttributeValue}:og-locale-alternate`);
      this.#document.head.appendChild(meta);
    }
  }

  #createManagedLink(): HTMLLinkElement {
    const link = this.#document.createElement('link');

    link.setAttribute(managedAttribute, `${managedAttributeValue}:link`);

    return link;
  }

  #removeManagedLinks(): void {
    this.#document
      .querySelectorAll(`link[${managedAttribute}="${managedAttributeValue}:link"]`)
      .forEach((element) => element.remove());
  }

  #removeManagedOpenGraphAlternateLocales(): void {
    this.#document
      .querySelectorAll(`meta[${managedAttribute}="${managedAttributeValue}:og-locale-alternate"]`)
      .forEach((element) => element.remove());
  }

  #removeManagedImage(): void {
    this.#document
      .querySelectorAll(`meta[${managedAttribute}="${managedAttributeValue}:og-image"]`)
      .forEach((element) => element.remove());
  }

  #removeManagedStructuredData(): void {
    this.#document
      .querySelectorAll(
        `script[type="${jsonLdMediaType}"][${managedAttribute}="${managedAttributeValue}:structured-data"]`,
      )
      .forEach((element) => element.remove());
  }

  #setHtmlLang(locale: SupportedLocale): void {
    this.#document.documentElement.setAttribute('lang', locale);
  }
}

export function absoluteUrl(path: string): string {
  return `${productionOrigin}${path.startsWith('/') ? path : `/${path}`}`;
}

export function absoluteMediaUrl(mediaRef: string | null | undefined): string | undefined {
  return absoluteProjectMediaUrl(mediaRef);
}

export function serializeJsonLd(value: unknown): string {
  const serialized = JSON.stringify(value);

  if (serialized === undefined) {
    throw new TypeError('JSON-LD value must be serializable.');
  }

  return serialized.replace(
    /[<>&\u2028\u2029]/gu,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0').toUpperCase()}`,
  );
}

function stripQueryAndFragment(path: string): string {
  return path.split(/[?#]/)[0] || '/';
}

function availableProjectLocales(
  locales: readonly string[] | undefined,
  currentLocale: SupportedLocale,
): readonly SupportedLocale[] {
  const normalizedLocales = (locales ?? [])
    .filter(isSupportedLocale)
    .filter((locale, index, allLocales) => allLocales.indexOf(locale) === index);

  return normalizedLocales.includes(currentLocale)
    ? normalizedLocales
    : [currentLocale, ...normalizedLocales];
}
