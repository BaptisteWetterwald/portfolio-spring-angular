import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  DOCUMENT,
  inject,
  Injectable,
  PLATFORM_ID,
  REQUEST,
  signal,
} from '@angular/core';

export const supportedThemes = ['light', 'dark'] as const;
export type ColorTheme = (typeof supportedThemes)[number];

export const defaultTheme: ColorTheme = 'light';
export const themeStorageKey = 'portfolio.theme';
export const themeCookieName = 'portfolio_theme';
export const themeCookieMaxAgeSeconds = 60 * 60 * 24 * 365;

@Injectable({
  providedIn: 'root',
})
export class ThemePreferenceService {
  readonly #destroyRef = inject(DestroyRef);
  readonly #document = inject(DOCUMENT);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #request = inject(REQUEST, { optional: true });
  readonly #theme = signal<ColorTheme>(defaultTheme);
  readonly #explicitPreference = signal<ColorTheme | undefined>(undefined);

  readonly theme = this.#theme.asReadonly();
  readonly explicitPreference = this.#explicitPreference.asReadonly();

  constructor() {
    const storedPreference = this.readStoredPreference();
    const resolvedTheme = storedPreference ?? this.#readSystemTheme();

    this.#explicitPreference.set(storedPreference);
    this.#setResolvedTheme(resolvedTheme);
    this.#listenToSystemTheme();
  }

  readStoredPreference(): ColorTheme | undefined {
    return this.#readBrowserStoredPreference() ?? this.#readCookieStoredPreference();
  }

  setTheme(theme: ColorTheme): void {
    this.#explicitPreference.set(theme);
    this.#setResolvedTheme(theme);
    this.#persistTheme(theme);
  }

  toggleTheme(): void {
    this.setTheme(this.#theme() === 'dark' ? 'light' : 'dark');
  }

  #setResolvedTheme(theme: ColorTheme): void {
    this.#theme.set(theme);
    this.#document.documentElement.setAttribute('data-theme', theme);
    this.#document.documentElement.style.colorScheme = theme;
  }

  #readBrowserStoredPreference(): ColorTheme | undefined {
    if (!isPlatformBrowser(this.#platformId)) {
      return undefined;
    }

    try {
      return toColorTheme(globalThis.localStorage?.getItem(themeStorageKey));
    } catch {
      return undefined;
    }
  }

  #readCookieStoredPreference(): ColorTheme | undefined {
    try {
      if (isPlatformBrowser(this.#platformId)) {
        return readThemePreferenceCookie(this.#document.cookie);
      }

      return readThemePreferenceCookie(this.#request?.headers.get('cookie'));
    } catch {
      return undefined;
    }
  }

  #readSystemTheme(): ColorTheme {
    if (!isPlatformBrowser(this.#platformId)) {
      return defaultTheme;
    }

    try {
      return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return defaultTheme;
    }
  }

  #listenToSystemTheme(): void {
    if (!isPlatformBrowser(this.#platformId) || typeof globalThis.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent): void => {
      if (this.#explicitPreference() === undefined) {
        this.#setResolvedTheme(event.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', listener);
    this.#destroyRef.onDestroy(() => mediaQuery.removeEventListener('change', listener));
  }

  #persistTheme(theme: ColorTheme): void {
    if (!isPlatformBrowser(this.#platformId)) {
      return;
    }

    try {
      globalThis.localStorage?.setItem(themeStorageKey, theme);
    } catch {
      // Storage can be unavailable in private browsing or restricted contexts.
    }

    this.#document.cookie = serializeThemePreferenceCookie(theme);
  }
}

export function toColorTheme(value: unknown): ColorTheme | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim().toLowerCase();

  return supportedThemes.includes(normalizedValue as ColorTheme)
    ? (normalizedValue as ColorTheme)
    : undefined;
}

export function readThemePreferenceCookie(
  cookieHeader: string | null | undefined,
): ColorTheme | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  for (const rawCookie of cookieHeader.split(';')) {
    const separatorIndex = rawCookie.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const name = rawCookie.slice(0, separatorIndex).trim();

    if (name !== themeCookieName) {
      continue;
    }

    return toColorTheme(decodeCookieValue(rawCookie.slice(separatorIndex + 1).trim()));
  }

  return undefined;
}

export function serializeThemePreferenceCookie(theme: ColorTheme): string {
  return `${themeCookieName}=${encodeURIComponent(theme)}; Path=/; Max-Age=${themeCookieMaxAgeSeconds}; SameSite=Lax`;
}

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
