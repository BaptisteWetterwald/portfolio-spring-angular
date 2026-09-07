import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from '../../app.routes';
import { themeCookieName, themeStorageKey } from '../../core/theme/theme-preference.service';

describe('SiteHeaderComponent integration', () => {
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

  it('contains conventional navigation without embedded maritime controls', async () => {
    const harness = await createHarness('/en');
    const header = harness.routeNativeElement?.querySelector('.site-header');

    expect(header?.querySelector('[data-primary-nav]')).not.toBeNull();
    expect(header?.querySelector('app-lighthouse-theme-toggle')).toBeNull();
    expect(header?.querySelector('app-sonar-navigation')).toBeNull();
  });

  it('opens and closes the mobile navigation from the trigger state', async () => {
    const harness = await createHarness('/en');
    const button = menuButton(harness);

    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(mobileMenu(harness)).toBeNull();

    button.click();
    await settleHarness(harness);

    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(mobileMenu(harness)?.querySelectorAll('a').length).toBe(5);

    button.click();
    await settleHarness(harness);

    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(mobileMenu(harness)).toBeNull();
  });

  it('focuses the first mobile navigation link after the menu renders', async () => {
    const harness = await createHarness('/en');

    menuButton(harness).click();
    await settleHarness(harness);

    const firstMobileLink = mobileMenu(harness)?.querySelector('a');

    expect(firstMobileLink).toBeInstanceOf(HTMLAnchorElement);
    expect(document.activeElement).toBe(firstMobileLink);
  });

  it('closes the mobile navigation when Escape is pressed', async () => {
    const harness = await createHarness('/en');

    menuButton(harness).click();
    await settleHarness(harness);

    expect(menuButton(harness).getAttribute('aria-expanded')).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settleHarness(harness);

    expect(menuButton(harness).getAttribute('aria-expanded')).toBe('false');
    expect(mobileMenu(harness)).toBeNull();
  });

  it('closes the mobile navigation after route changes', async () => {
    const harness = await createHarness('/en');

    menuButton(harness).click();
    await settleHarness(harness);

    expect(menuButton(harness).getAttribute('aria-expanded')).toBe('true');

    await harness.navigateByUrl('/en#projects');
    await settleHarness(harness);

    expect(TestBed.inject(Router).url).toBe('/en#projects');
    expect(menuButton(harness).getAttribute('aria-expanded')).toBe('false');
    expect(mobileMenu(harness)).toBeNull();
  });
});

async function createHarness(initialUrl: string): Promise<RouterTestingHarness> {
  setSystemTheme(false);
  TestBed.configureTestingModule({
    providers: [provideRouter(routes)],
  });

  return RouterTestingHarness.create(initialUrl);
}

function menuButton(harness: RouterTestingHarness): HTMLButtonElement {
  const button = harness.routeNativeElement?.querySelector('.site-header__menu-button');

  expect(button).toBeInstanceOf(HTMLButtonElement);

  return button as HTMLButtonElement;
}

function mobileMenu(harness: RouterTestingHarness): HTMLElement | null {
  return harness.routeNativeElement?.querySelector('#mobile-primary-navigation') ?? null;
}

async function settleHarness(harness: RouterTestingHarness): Promise<void> {
  harness.detectChanges();
  await harness.fixture.whenStable();
  await Promise.resolve();
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
