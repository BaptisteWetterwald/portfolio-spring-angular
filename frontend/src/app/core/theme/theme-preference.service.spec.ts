import { DOCUMENT, PLATFORM_ID, REQUEST } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  ColorTheme,
  readThemePreferenceCookie,
  serializeThemePreferenceCookie,
  ThemePreferenceService,
  themeCookieName,
  themeStorageKey,
  toColorTheme,
} from './theme-preference.service';

describe('ThemePreferenceService', () => {
  const originalMatchMedia = globalThis.matchMedia;

  afterEach(() => {
    TestBed.resetTestingModule();

    try {
      globalThis.localStorage?.removeItem(themeStorageKey);
    } catch {
      // Browser storage is optional in tests.
    }

    document.cookie = `${themeCookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';

    if (originalMatchMedia) {
      Object.defineProperty(globalThis, 'matchMedia', {
        configurable: true,
        writable: true,
        value: originalMatchMedia,
      });
    } else {
      Reflect.deleteProperty(globalThis, 'matchMedia');
    }
  });

  it('persists explicit theme choices to browser storage, cookie storage, and root state', () => {
    setSystemTheme('light');
    configureService('browser');

    const service = TestBed.inject(ThemePreferenceService);

    service.setTheme('dark');

    expect(service.theme()).toBe('dark');
    expect(service.explicitPreference()).toBe('dark');
    expect(globalThis.localStorage?.getItem(themeStorageKey)).toBe('dark');
    expect(TestBed.inject(DOCUMENT).cookie).toContain('portfolio_theme=dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('uses the system preference when no explicit choice exists', () => {
    setSystemTheme('dark');
    configureService('browser');

    const service = TestBed.inject(ThemePreferenceService);

    expect(service.explicitPreference()).toBeUndefined();
    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('ignores invalid stored preferences safely', () => {
    globalThis.localStorage?.setItem(themeStorageKey, 'blue');
    document.cookie = `${themeCookieName}=unknown; Path=/; SameSite=Lax`;
    setSystemTheme('light');
    configureService('browser');

    const service = TestBed.inject(ThemePreferenceService);

    expect(service.readStoredPreference()).toBeUndefined();
    expect(service.theme()).toBe('light');
  });

  it('normalizes explicit browser storage and keeps it ahead of cookies', () => {
    globalThis.localStorage?.setItem(themeStorageKey, ' DARK ');
    document.cookie = `${themeCookieName}=light; Path=/; SameSite=Lax`;
    setSystemTheme('light');
    configureService('browser');

    const service = TestBed.inject(ThemePreferenceService);

    expect(service.readStoredPreference()).toBe('dark');
    expect(service.theme()).toBe('dark');
  });

  it('updates the root theme state when toggled', () => {
    setSystemTheme('light');
    configureService('browser');

    const service = TestBed.inject(ThemePreferenceService);

    service.toggleTheme();

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    service.toggleTheme();

    expect(service.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('uses the SSR theme cookie without reading browser-only globals', () => {
    const matchMedia = vi.fn(() => {
      throw new Error('matchMedia should not be called during SSR');
    });
    Object.defineProperty(globalThis, 'matchMedia', {
      configurable: true,
      writable: true,
      value: matchMedia,
    });
    configureService(
      'server',
      new Request('https://bwetterwald.fr/en', {
        headers: {
          cookie: 'portfolio_theme=dark',
        },
      }),
    );

    const service = TestBed.inject(ThemePreferenceService);

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(matchMedia).not.toHaveBeenCalled();
  });

  it('falls back to light during SSR when no explicit theme cookie exists', () => {
    configureService('server', new Request('https://bwetterwald.fr/en'));

    const service = TestBed.inject(ThemePreferenceService);

    expect(service.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('normalizes theme values and cookies defensively', () => {
    expect(toColorTheme(' DARK ')).toBe('dark');
    expect(toColorTheme('blue')).toBeUndefined();
    expect(readThemePreferenceCookie('other=1; portfolio_theme=%20DARK%20')).toBe('dark');
    expect(readThemePreferenceCookie('other=1; portfolio_theme=%E0%A4%A')).toBeUndefined();
    expect(serializeThemePreferenceCookie('dark')).toContain('portfolio_theme=dark');
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

function setSystemTheme(theme: ColorTheme): void {
  const mediaQuery = {
    matches: theme === 'dark',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList;

  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockReturnValue(mediaQuery),
  });
}
