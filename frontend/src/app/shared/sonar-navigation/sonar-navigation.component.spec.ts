import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { routes } from '../../app.routes';
import { ProjectApiService } from '../../core/projects/project-api.service';
import { themeCookieName, themeStorageKey } from '../../core/theme/theme-preference.service';

describe('SonarNavigationComponent integration', () => {
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

  it('renders five semantic compass links with localized English URLs', async () => {
    const harness = await createHarness('/en');
    const links = sonarLinks(harness);

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'Home',
      'Education',
      'Experience',
      'Projects',
      'Contact',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/en#home',
      '/en#education',
      '/en#experience',
      '/en#projects',
      '/en#contact',
    ]);
    expect(
      harness.routeNativeElement
        ?.querySelector('nav[data-sonar-nav][data-sonar-nav-variant="floating"]')
        ?.getAttribute('aria-label'),
    ).toBe('Compact compass navigation');
  });

  it('exposes the active section as the current location', async () => {
    const harness = await createHarness('/fr#education');
    const formation = sonarLink(harness, 'Formation');
    const accueil = sonarLink(harness, 'Accueil');

    expect(formation?.getAttribute('aria-current')).toBe('location');
    expect(formation?.getAttribute('data-active')).toBe('true');
    expect(accueil?.getAttribute('aria-current')).toBeNull();
  });

  it('does not mark a main destination active on localized 404 routes', async () => {
    const harness = await createHarness('/fr/projets/inconnu');

    expect(sonarLinks(harness).every((link) => link.getAttribute('aria-current') === null)).toBe(
      true,
    );
  });

  it('keeps the visual compass static and non-canvas based', async () => {
    const harness = await createHarness('/en#projects');
    const sonarNav = floatingSonarNav(harness);

    expect(sonarNav?.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(sonarNav?.querySelector('canvas')).toBeNull();
    expect(sonarNav?.querySelector('.sonar-nav__bearing')).toBeNull();
    expect(sonarLinks(harness).length).toBe(5);
  });

  it.each([
    ['Home', 'home'],
    ['Education', 'education'],
    ['Experience', 'experience'],
    ['Projects', 'projects'],
    ['Contact', 'contact'],
  ] as const)('navigates the %s waypoint to #%s', async (label, sectionId) => {
    const harness = await createHarness('/en');

    sonarLink(harness, label)?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }),
    );
    await settleHarness(harness);

    expect(TestBed.inject(Router).url).toBe(`/en#${sectionId}`);
    expect(sonarLink(harness, label)?.getAttribute('aria-current')).toBe('location');
  });
});

async function createHarness(initialUrl: string): Promise<RouterTestingHarness> {
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

  const harness = await RouterTestingHarness.create(initialUrl);

  await settleHarness(harness);

  return harness;
}

function sonarLinks(harness: RouterTestingHarness): HTMLAnchorElement[] {
  return Array.from(
    harness.routeNativeElement?.querySelectorAll(
      'nav[data-sonar-nav][data-sonar-nav-variant="floating"] a',
    ) ?? [],
  ).filter((link): link is HTMLAnchorElement => link instanceof HTMLAnchorElement);
}

function floatingSonarNav(harness: RouterTestingHarness): HTMLElement | null {
  return (
    harness.routeNativeElement?.querySelector(
      'nav[data-sonar-nav][data-sonar-nav-variant="floating"]',
    ) ?? null
  );
}

function sonarLink(harness: RouterTestingHarness, label: string): HTMLAnchorElement | undefined {
  return sonarLinks(harness).find((link) => link.textContent?.trim() === label);
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
