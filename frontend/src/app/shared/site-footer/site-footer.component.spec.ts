import { HttpErrorResponse } from '@angular/common/http';
import { TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { routes } from '../../app.routes';
import { ProjectApiService } from '../../core/projects/project-api.service';
import { themeCookieName, themeStorageKey } from '../../core/theme/theme-preference.service';
import { siteFooterYearStateKey } from './site-footer.component';

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

  it('marks the current footer section location', async () => {
    const harness = await createHarness('/fr#contact');

    expect(footerLink(harness, 'Contact')?.getAttribute('aria-current')).toBe('location');
  });

  it('does not mark unrelated footer routes current', async () => {
    const harness = await createHarness('/en#projects');

    expect(footerLink(harness, 'Projects')?.getAttribute('aria-current')).toBe('location');
    expect(footerLink(harness, 'Home')?.getAttribute('aria-current')).toBeNull();
    expect(footerLink(harness, 'Contact')?.getAttribute('aria-current')).toBeNull();
  });

  it('does not mark footer links current on localized 404 routes', async () => {
    const harness = await createHarness('/fr/projets/inconnu');

    expect(footerLinks(harness).every((link) => link.getAttribute('aria-current') === null)).toBe(
      true,
    );
  });

  it('reuses the transferred SSR year for stable hydration', async () => {
    const harness = await createHarness('/en', () => {
      TestBed.inject(TransferState).set(siteFooterYearStateKey, 2042);
    });

    expect(footerCopyright(harness)?.textContent).toContain('2042');
  });
});

async function createHarness(
  initialUrl: string,
  beforeCreate?: () => void,
): Promise<RouterTestingHarness> {
  setSystemTheme(false);
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes),
      {
        provide: ProjectApiService,
        useValue: {
          listProjects: () => of([]),
          getProject: () =>
            throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })),
        },
      },
    ],
  });
  beforeCreate?.();

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

function footerCopyright(harness: RouterTestingHarness): HTMLParagraphElement | null {
  return harness.routeNativeElement?.querySelector('footer .site-footer__copyright') ?? null;
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
