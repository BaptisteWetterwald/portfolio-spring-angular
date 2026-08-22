import { DOCUMENT } from '@angular/core';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { LocaleContextService } from '../i18n/locale-context.service';
import { SupportedLocale, supportedLocales } from '../i18n/locales';
import { TranslationService } from '../i18n/translation.service';
import { TranslationKey } from '../i18n/translations';
import { localizedAlternates, localizedPath, StaticPageId } from '../routing/localized-routes';

const productionOrigin = 'https://bwetterwald.fr';
const managedAttribute = 'data-managed-by';
const managedAttributeValue = 'page-metadata-service';
const xDefaultUrl = `${productionOrigin}/`;

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
    });
    this.#removeManagedLinks();
  }

  #applyMetadata(metadata: {
    readonly title: string;
    readonly description: string;
    readonly url: string;
    readonly locale: SupportedLocale;
    readonly robots: string;
    readonly includeOpenGraphAlternateLocales: boolean;
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
    this.#meta.updateTag({ property: 'og:type', content: 'website' }, 'property="og:type"');
    this.#meta.updateTag({ property: 'og:url', content: metadata.url }, 'property="og:url"');
    this.#meta.updateTag(
      { property: 'og:locale', content: ogLocales[metadata.locale] },
      'property="og:locale"',
    );
    if (metadata.includeOpenGraphAlternateLocales) {
      this.#setOpenGraphAlternateLocales(metadata.locale);
    } else {
      this.#removeManagedOpenGraphAlternateLocales();
    }
  }

  #setCanonical(url: string): void {
    const link = this.#createManagedLink();

    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    this.#document.head.appendChild(link);
  }

  #setAlternates(alternates: Record<SupportedLocale, string>): void {
    for (const locale of supportedLocales) {
      const link = this.#createManagedLink();

      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', locale);
      link.setAttribute('href', absoluteUrl(alternates[locale]));
      this.#document.head.appendChild(link);
    }

    const defaultLink = this.#createManagedLink();

    defaultLink.setAttribute('rel', 'alternate');
    defaultLink.setAttribute('hreflang', 'x-default');
    defaultLink.setAttribute('href', xDefaultUrl);
    this.#document.head.appendChild(defaultLink);
  }

  #setOpenGraphAlternateLocales(locale: SupportedLocale): void {
    this.#removeManagedOpenGraphAlternateLocales();

    for (const alternateLocale of supportedLocales.filter(
      (supportedLocale) => supportedLocale !== locale,
    )) {
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

  #setHtmlLang(locale: SupportedLocale): void {
    this.#document.documentElement.setAttribute('lang', locale);
  }
}

export function absoluteUrl(path: string): string {
  return `${productionOrigin}${path.startsWith('/') ? path : `/${path}`}`;
}

function stripQueryAndFragment(path: string): string {
  return path.split(/[?#]/)[0] || '/';
}
