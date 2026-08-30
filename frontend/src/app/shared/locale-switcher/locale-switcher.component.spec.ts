import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { routes } from '../../app.routes';
import { localeCookieName, localeStorageKey } from '../../core/i18n/locales';
import { ProjectApiService } from '../../core/projects/project-api.service';
import { ProjectDetailDto, ProjectSummaryDto } from '../../core/projects/project.models';

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

  it('preserves the shared project slug when switching locale on detail pages', async () => {
    const harness = await createHarness('/fr/projets/portfolio-api', {
      getProject: () => of(detailProject()),
    });
    const englishLink = localeLink(harness, 'en');

    expect(englishLink?.getAttribute('href')).toBe('/en/projects/portfolio-api');
  });

  it('links to the target projects index when the project translation is unavailable', async () => {
    const harness = await createHarness('/en/projects/portfolio-api', {
      getProject: () => of(detailProject({ availableLocales: ['en'] })),
    });
    const frenchLink = localeLink(harness, 'fr');

    expect(frenchLink?.getAttribute('href')).toBe('/fr/projets');
  });

  it('clears project-specific locale behavior after navigating away from detail', async () => {
    const harness = await createHarness('/en/projects/portfolio-api', {
      getProject: () => of(detailProject({ availableLocales: ['en'] })),
    });

    expect(localeLink(harness, 'fr')?.getAttribute('href')).toBe('/fr/projets');

    await harness.navigateByUrl('/en/education');
    await settleHarness(harness);

    expect(localeLink(harness, 'fr')?.getAttribute('href')).toBe('/fr/formation');
  });
});

async function createHarness(
  initialUrl: string,
  projectApiOverrides: Partial<ProjectApiService> = {},
): Promise<RouterTestingHarness> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes),
      {
        provide: ProjectApiService,
        useValue: projectApiStub(projectApiOverrides),
      },
    ],
  });

  return RouterTestingHarness.create(initialUrl);
}

function projectApiStub(overrides: Partial<ProjectApiService>) {
  return {
    listProjects: () => of([]),
    listFeaturedProjects: () => of([]),
    getProject: () =>
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })),
    ...overrides,
  };
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

function summaryProject(): ProjectSummaryDto {
  return {
    slug: 'portfolio-api',
    title: 'Portfolio API',
    shortDescription: 'Public API fixture.',
    logoMediaRef: null,
    githubUrl: null,
    demoUrl: null,
    featured: true,
    status: 'PUBLISHED',
    presentationMode: 'DETAIL',
    displayOrder: 10,
    technologies: [],
  };
}

function detailProject(overrides: Partial<ProjectDetailDto> = {}): ProjectDetailDto {
  return {
    ...summaryProject(),
    detailedDescription: null,
    sections: [],
    availableLocales: ['fr', 'en'],
    ...overrides,
  };
}
