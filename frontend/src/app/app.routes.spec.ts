import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { localeCookieName, localeStorageKey } from './core/i18n/locales';
import { ProjectApiService } from './core/projects/project-api.service';
import { ProjectDetailDto, ProjectSummaryDto } from './core/projects/project.models';
import { routes } from './app.routes';

describe('localized app routes', () => {
  afterEach(() => {
    try {
      globalThis.localStorage?.removeItem(localeStorageKey);
    } catch {
      // Browser storage is optional in tests.
    }

    document.cookie = `${localeCookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
  });

  it.each([
    ['/fr', 'Ingénieur logiciel'],
    ['/en', 'Software Engineer'],
  ] as const)('renders %s as one composed portfolio document', async (url, positioning) => {
    const harness = await createHarness(url);
    const root = harness.routeNativeElement;

    expect(root?.querySelector('app-home-page h1')?.textContent).toContain('Baptiste Wetterwald');
    expect(root?.textContent).toContain(positioning);
    expect(portfolioSectionIds(root)).toEqual([
      'home',
      'education',
      'experience',
      'projects',
      'contact',
    ]);
  });

  it.each([
    ['/fr/formation', '/fr#education', 'Formation'],
    ['/fr/experience', '/fr#experience', 'Expérience professionnelle'],
    ['/fr/projets', '/fr#projects', 'Projets'],
    ['/fr/contact', '/fr#contact', 'Contact'],
    ['/en/education', '/en#education', 'Education'],
    ['/en/experience', '/en#experience', 'Professional experience'],
    ['/en/projects', '/en#projects', 'Projects'],
    ['/en/contact', '/en#contact', 'Contact'],
  ] as const)('redirects compatibility route %s to %s', async (legacyUrl, expectedUrl, heading) => {
    const harness = await createHarness(legacyUrl);

    expect(TestBed.inject(Router).url).toBe(expectedUrl);
    expect(harness.routeNativeElement?.textContent).toContain(heading);
    expect(harness.routeNativeElement?.querySelector('app-portfolio-page')).not.toBeNull();
  });

  it('renders API-backed projects inside the composed document', async () => {
    const harness = await createHarness('/en#projects', {
      listProjects: () => of([summaryProject()]),
    });

    expect(harness.routeNativeElement?.querySelector('#projects h2')?.textContent).toContain(
      'Projects',
    );
    expect(harness.routeNativeElement?.textContent).toContain('Portfolio API');
  });

  it('keeps localized project detail routes with shared slugs', async () => {
    const harness = await createHarness('/fr/projets/portfolio-api', {
      getProject: () => of(detailProject()),
    });

    expect(
      harness.routeNativeElement?.querySelector('app-project-detail-page h1')?.textContent,
    ).toContain('Portfolio API');
    expect(TestBed.inject(Router).url).toBe('/fr/projets/portfolio-api');
  });

  it('does not silently render supported content for unsupported locale prefixes', async () => {
    const harness = await createHarness('/de');

    expect(
      harness.routeNativeElement?.querySelector('app-not-found-page h1')?.textContent,
    ).toContain('Page not found');
    expect(TestBed.inject(Router).url).toBe('/de');
  });

  it('redirects / to the stored explicit browser locale preference', async () => {
    globalThis.localStorage?.setItem(localeStorageKey, 'fr');
    const harness = await createHarness('/');

    expect(TestBed.inject(Router).url).toBe('/fr');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Baptiste Wetterwald',
    );
  });

  it('renders the public shell landmarks around the portfolio document', async () => {
    const harness = await createHarness('/en');
    const root = harness.routeNativeElement;

    expect(root?.querySelector('header')).not.toBeNull();
    expect(root?.querySelector('footer')).not.toBeNull();
    expect(root?.querySelector('a[href="#main-content"]')?.textContent).toContain(
      'Skip to content',
    );
    expect(root?.querySelector('main#main-content')).not.toBeNull();
    expect(root?.querySelector('nav[data-primary-nav]')).not.toBeNull();
  });

  it('renders localized primary navigation as stable section links', async () => {
    const harness = await createHarness('/fr');
    const links = primaryNavLinks(harness);

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'Accueil',
      'Formation',
      'Expérience',
      'Projets',
      'Contact',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/fr#home',
      '/fr#education',
      '/fr#experience',
      '/fr#projects',
      '/fr#contact',
    ]);
  });

  it('uses aria-current location semantics for the active section', async () => {
    const harness = await createHarness('/fr#projects');

    expect(navLink(harness, 'Projets')?.getAttribute('aria-current')).toBe('location');

    await harness.navigateByUrl('/fr/projets/inconnu');
    await settleHarness(harness);

    expect(
      harness.routeNativeElement?.querySelector('app-not-found-page h1')?.textContent,
    ).toContain('Page introuvable');
    expect(
      harness.routeNativeElement
        ?.querySelector<HTMLAnchorElement>('app-not-found-page a')
        ?.getAttribute('href'),
    ).toBe('/fr#projects');
    expect(navLink(harness, 'Projets')?.getAttribute('aria-current')).toBeNull();
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

  const harness = await RouterTestingHarness.create(initialUrl);

  await settleHarness(harness);

  return harness;
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

function navLink(harness: RouterTestingHarness, label: string): HTMLAnchorElement | undefined {
  return primaryNavLinks(harness).find(
    (link): link is HTMLAnchorElement =>
      link instanceof HTMLAnchorElement && link.textContent?.trim() === label,
  );
}

function primaryNavLinks(harness: RouterTestingHarness): HTMLAnchorElement[] {
  return Array.from(
    harness.routeNativeElement?.querySelectorAll('nav[data-primary-nav] a') ?? [],
  ).filter((link): link is HTMLAnchorElement => link instanceof HTMLAnchorElement);
}

function portfolioSectionIds(root: HTMLElement | null | undefined): string[] {
  return Array.from(root?.querySelectorAll<HTMLElement>('[data-portfolio-section]') ?? []).map(
    (section) => section.id,
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

function detailProject(): ProjectDetailDto {
  return {
    ...summaryProject(),
    detailedDescription: null,
    sections: [],
    availableLocales: ['fr', 'en'],
  };
}
