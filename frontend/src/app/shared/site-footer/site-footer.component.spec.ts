import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from '../../app.routes';
import { themeCookieName, themeStorageKey } from '../../core/theme/theme-preference.service';

describe('SiteFooterComponent integration', () => {
  const originalMatchMedia = globalThis.matchMedia;

  afterEach(() => {
    TestBed.resetTestingModule();

    try {
      globalThis.localStorage?.removeItem(themeStorageKey);
    } catch {
      // Browser storage is optional in tests.
    }

    document.cookie = `${themeCookieName}=; Path=/; Max-Age=0; SameSite=Lax`;

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

  it('marks the exact current footer route', async () => {
    const harness = await createHarness('/fr/contact');

    expect(footerLink(harness, 'Contact')?.getAttribute('aria-current')).toBe('page');
  });

  it('does not mark unrelated footer routes current', async () => {
    const harness = await createHarness('/en/projects');

    expect(footerLink(harness, 'Projects')?.getAttribute('aria-current')).toBe('page');
    expect(footerLink(harness, 'Home')?.getAttribute('aria-current')).toBeNull();
    expect(footerLink(harness, 'Contact')?.getAttribute('aria-current')).toBeNull();
  });

  it('does not mark footer links current on localized 404 routes', async () => {
    const harness = await createHarness('/fr/projets/inconnu');

    expect(footerLinks(harness).every((link) => link.getAttribute('aria-current') === null)).toBe(
      true,
    );
  });
});

async function createHarness(initialUrl: string): Promise<RouterTestingHarness> {
  setSystemTheme(false);
  TestBed.configureTestingModule({
    providers: [provideRouter(routes)],
  });

  const harness = await RouterTestingHarness.create(initialUrl);

  await settleHarness(harness);

  return harness;
}

function footerLinks(harness: RouterTestingHarness): HTMLAnchorElement[] {
  return Array.from(harness.routeNativeElement?.querySelectorAll('footer nav a') ?? []).filter(
    (link): link is HTMLAnchorElement => link instanceof HTMLAnchorElement,
  );
}

function footerLink(harness: RouterTestingHarness, label: string): HTMLAnchorElement | undefined {
  return footerLinks(harness).find((link) => link.textContent?.trim() === label);
}

async function settleHarness(harness: RouterTestingHarness): Promise<void> {
  harness.detectChanges();
  await harness.fixture.whenStable();
  harness.detectChanges();
}

function setSystemTheme(prefersDark: boolean): void {
  const mediaQuery = {
    matches: prefersDark,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList;

  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockReturnValue(mediaQuery),
  });
}
