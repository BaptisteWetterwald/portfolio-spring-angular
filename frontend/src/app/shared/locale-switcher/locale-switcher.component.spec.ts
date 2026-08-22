import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from '../../app.routes';
import { localeCookieName, localeStorageKey } from '../../core/i18n/locales';

describe('LocaleSwitcherComponent integration', () => {
  afterEach(() => {
    TestBed.resetTestingModule();

    try {
      globalThis.localStorage?.removeItem(localeStorageKey);
    } catch {
      // Browser storage is optional in tests.
    }

    document.cookie = `${localeCookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
  });

  it('preserves the equivalent localized route with accessible language labels', async () => {
    const harness = await createHarness('/fr/formation');
    const frenchLink = localeLink(harness, 'fr');
    const englishLink = localeLink(harness, 'en');

    expect(frenchLink?.getAttribute('aria-current')).toBe('page');
    expect(frenchLink?.getAttribute('aria-label')).toBe('Ouvrir la version française');
    expect(englishLink?.getAttribute('href')).toBe('/en/education');
    expect(englishLink?.getAttribute('aria-label')).toBe('Ouvrir la version anglaise');
    expect(englishLink?.textContent?.trim()).toBe('English');
  });

  it('persists locale choices through the existing preference mechanism', async () => {
    const harness = await createHarness('/fr/formation');
    const englishLink = localeLink(harness, 'en');

    englishLink?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await settleHarness(harness);

    expect(TestBed.inject(Router).url).toBe('/en/education');
    expect(globalThis.localStorage?.getItem(localeStorageKey)).toBe('en');
    expect(document.cookie).toContain('portfolio_locale=en');
  });
});

async function createHarness(initialUrl: string): Promise<RouterTestingHarness> {
  TestBed.configureTestingModule({
    providers: [provideRouter(routes)],
  });

  return RouterTestingHarness.create(initialUrl);
}

function localeLink(
  harness: RouterTestingHarness,
  locale: 'fr' | 'en',
): HTMLAnchorElement | undefined {
  return Array.from(
    harness.routeNativeElement?.querySelectorAll('app-locale-switcher a') ?? [],
  ).find(
    (link): link is HTMLAnchorElement =>
      link instanceof HTMLAnchorElement && link.getAttribute('lang') === locale,
  );
}

async function settleHarness(harness: RouterTestingHarness): Promise<void> {
  harness.detectChanges();
  await harness.fixture.whenStable();
  harness.detectChanges();
}
