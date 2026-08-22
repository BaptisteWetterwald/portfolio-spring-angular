import { DOCUMENT } from '@angular/core';
import { PLATFORM_ID, REQUEST } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { localeCookieName, localeStorageKey } from './locales';
import { LocalePreferenceService } from './locale-preference.service';

describe('LocalePreferenceService', () => {
  afterEach(() => {
    try {
      globalThis.localStorage?.removeItem(localeStorageKey);
    } catch {
      // Browser storage is optional in tests.
    }

    document.cookie = `${localeCookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
  });

  it('uses browser local storage as an explicit preference', () => {
    globalThis.localStorage?.setItem(localeStorageKey, 'fr');
    configureService('browser');

    expect(TestBed.inject(LocalePreferenceService).resolveEntryLocale()).toBe('fr');
  });

  it('uses the SSR locale cookie before Accept-Language', () => {
    configureService(
      'server',
      new Request('https://bwetterwald.fr/', {
        headers: {
          cookie: 'portfolio_locale=fr',
          'accept-language': 'en-US,en;q=0.9',
        },
      }),
    );

    expect(TestBed.inject(LocalePreferenceService).resolveEntryLocale()).toBe('fr');
  });

  it('uses SSR Accept-Language when no stored preference exists', () => {
    configureService(
      'server',
      new Request('https://bwetterwald.fr/', {
        headers: {
          'accept-language': 'fr-FR,fr;q=0.9',
        },
      }),
    );

    expect(TestBed.inject(LocalePreferenceService).resolveEntryLocale()).toBe('fr');
  });

  it('persists explicit browser choices to local storage and cookie storage', () => {
    configureService('browser');

    TestBed.inject(LocalePreferenceService).persistLocaleChoice('en');

    expect(globalThis.localStorage?.getItem(localeStorageKey)).toBe('en');
    expect(TestBed.inject(DOCUMENT).cookie).toContain('portfolio_locale=en');
  });
});

function configureService(platformId: 'browser' | 'server', request?: Request): void {
  TestBed.configureTestingModule({
    providers: [
      { provide: PLATFORM_ID, useValue: platformId },
      ...(request ? [{ provide: REQUEST, useValue: request }] : []),
    ],
  });
}
