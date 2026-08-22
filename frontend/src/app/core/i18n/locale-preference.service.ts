import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/core';
import { inject, Injectable, PLATFORM_ID, REQUEST } from '@angular/core';

import {
  readLocalePreferenceCookie,
  resolvePreferredLocale,
  serializeLocalePreferenceCookie,
} from './locale-resolution';
import { localeStorageKey, SupportedLocale, toSupportedLocale } from './locales';

@Injectable({
  providedIn: 'root',
})
export class LocalePreferenceService {
  readonly #document = inject(DOCUMENT);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #request = inject(REQUEST, { optional: true });

  resolveEntryLocale(): SupportedLocale {
    return resolvePreferredLocale({
      storedPreference: this.readStoredPreference(),
      acceptLanguageHeader: this.#readAcceptLanguageHeader() ?? this.#readBrowserLanguages(),
    });
  }

  readStoredPreference(): SupportedLocale | undefined {
    return this.#readBrowserStoredPreference() ?? this.#readCookieStoredPreference();
  }

  persistLocaleChoice(locale: SupportedLocale): void {
    if (!isPlatformBrowser(this.#platformId)) {
      return;
    }

    try {
      globalThis.localStorage?.setItem(localeStorageKey, locale);
    } catch {
      // Storage can be unavailable in private browsing or restricted contexts.
    }

    this.#document.cookie = serializeLocalePreferenceCookie(locale);
  }

  #readBrowserStoredPreference(): SupportedLocale | undefined {
    if (!isPlatformBrowser(this.#platformId)) {
      return undefined;
    }

    try {
      return toSupportedLocale(globalThis.localStorage?.getItem(localeStorageKey));
    } catch {
      return undefined;
    }
  }

  #readCookieStoredPreference(): SupportedLocale | undefined {
    if (isPlatformBrowser(this.#platformId)) {
      return readLocalePreferenceCookie(this.#document.cookie);
    }

    return readLocalePreferenceCookie(this.#request?.headers.get('cookie'));
  }

  #readAcceptLanguageHeader(): string | undefined {
    return this.#request?.headers.get('accept-language') ?? undefined;
  }

  #readBrowserLanguages(): string | undefined {
    if (!isPlatformBrowser(this.#platformId)) {
      return undefined;
    }

    const languages = globalThis.navigator?.languages;

    if (languages?.length) {
      return languages.join(',');
    }

    return globalThis.navigator?.language;
  }
}
