import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { localeCookieName, localeStorageKey } from './core/i18n/locales';
import { GitHubActivityApiService } from './core/github/github-activity-api.service';
import { GitHubActivityDto } from './core/github/github-activity.models';
import { ProjectApiService } from './core/projects/project-api.service';
import { ProjectDetailDto, ProjectSummaryDto } from './core/projects/project.models';
import { RouteFocusService } from './core/routing/route-focus.service';
import { routes } from './app.routes';

describe('localized app routes', () => {
  afterEach(() => {
    try {
      globalThis.localStorage?.removeItem(localeStorageKey);
    } catch {
      // Browser storage is optional in tests.
    }

    document.cookie = `${localeCookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
    document.head
      .querySelectorAll('[data-managed-by^="page-metadata-service"]')
      .forEach((element) => element.remove());
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
      'experience',
      'education',
      'projects',
      'contact',
    ]);
  });

  it('moves focus to a healthy project heading and back to the localized Projects section', async () => {
    const harness = await createHarness('/en', {
      getProject: () => of(detailProject()),
    });

    primaryNavLinks(harness)[0]?.focus();
    await harness.navigateByUrl('/en/projects/portfolio-api');
    await settleHarness(harness);

    expect(document.activeElement).toBe(
      harness.routeNativeElement?.querySelector('#project-title'),
    );

    await harness.navigateByUrl('/en#projects');
    await settleHarness(harness);

    expect(document.activeElement).toBe(harness.routeNativeElement?.querySelector('#projects'));
  });

  it('moves focus to the translated primary heading on a locale route change', async () => {
    const harness = await createHarness('/fr');

    primaryNavLinks(harness)[0]?.focus();
    await harness.navigateByUrl('/en');
    await settleHarness(harness);

    const heading = harness.routeNativeElement?.querySelector<HTMLElement>('#home-title');

    expect(heading?.textContent).toContain('Baptiste Wetterwald');
    expect(document.activeElement).toBe(heading);
  });

  it('moves focus to the localized not-found heading after a project 404', async () => {
    const harness = await createHarness('/en');

    primaryNavLinks(harness)[0]?.focus();
    await harness.navigateByUrl('/en/projects/missing-project');
    await settleHarness(harness);

    const heading = harness.routeNativeElement?.querySelector<HTMLElement>(
      'app-not-found-page [data-route-focus-target]',
    );

    expect(heading?.textContent).toContain('Page not found');
    expect(document.activeElement).toBe(heading);
  });

  it('moves focus to the temporary-unavailable heading after a project 503', async () => {
    const harness = await createHarness('/fr', {
      getProject: () =>
        throwError(() => new HttpErrorResponse({ status: 503, statusText: 'Unavailable' })),
    });

    primaryNavLinks(harness)[0]?.focus();
    await harness.navigateByUrl('/fr/projets/temporarily-unavailable');
    await settleHarness(harness);

    const heading = harness.routeNativeElement?.querySelector<HTMLElement>('#project-error-title');

    expect(heading?.textContent).toContain('Le projet ne peut pas être chargé');
    expect(document.activeElement).toBe(heading);
  });

  it('does not move focus for a same-document fragment navigation', async () => {
    const harness = await createHarness('/en');
    const retainedControl = primaryNavLinks(harness)[0]!;

    retainedControl.focus();
    await harness.navigateByUrl('/en#projects');
    await settleHarness(harness);

    expect(document.activeElement).toBe(retainedControl);
  });

  it('replaces the ProfilePage payload on client locale navigation without changing Person identity', async () => {
    const harness = await createHarness('/fr');
    const frenchProfile = managedStructuredData();

    expect(socialMetadataContent('property', 'og:image:alt')).toBe(
      'Carte de présentation de Baptiste Wetterwald avec portrait et univers maritime.',
    );
    expect(socialMetadataContent('name', 'twitter:title')).toBe(
      'Baptiste Wetterwald | Ingénieur logiciel',
    );

    await harness.navigateByUrl('/en');
    await settleHarness(harness);

    const englishProfile = managedStructuredData();

    expect(managedStructuredDataScripts()).toHaveLength(1);
    expect(frenchProfile['@id']).toBe('https://bwetterwald.fr/fr#profile-page');
    expect(frenchProfile['inLanguage']).toBe('fr');
    expect(englishProfile['@id']).toBe('https://bwetterwald.fr/en#profile-page');
    expect(englishProfile['inLanguage']).toBe('en');
    expect(personFrom(frenchProfile)['@id']).toBe('https://bwetterwald.fr/#person');
    expect(personFrom(englishProfile)['@id']).toBe('https://bwetterwald.fr/#person');
    expect(personFrom(englishProfile)['sameAs']).toEqual([
      'https://github.com/BaptisteWetterwald',
      'https://www.linkedin.com/in/baptiste-wetterwald/',
    ]);
    expect(managedSocialMetadata()).toHaveLength(11);
    expect(socialMetadataContent('property', 'og:image:alt')).toBe(
      'Baptiste Wetterwald profile card with portrait and maritime visuals.',
    );
    expect(socialMetadataContent('name', 'twitter:title')).toBe(
      'Baptiste Wetterwald | Software Engineer',
    );
  });

  it('replaces main-page social metadata on a healthy project detail', async () => {
    const harness = await createHarness('/en', {
      getProject: () => of(detailProject()),
    });

    expect(managedStructuredDataScripts()).toHaveLength(1);

    await harness.navigateByUrl('/en/projects/portfolio-api');
    await settleHarness(harness);

    expect(managedStructuredDataScripts()).toHaveLength(0);
    expect(managedSocialMetadata()).toHaveLength(11);
    expect(socialMetadataContent('property', 'og:image')).toBe(
      'https://bwetterwald.fr/assets/social/baptiste-wetterwald-social-card-v2.jpg',
    );
    expect(socialMetadataContent('name', 'twitter:title')).toBe(
      'Portfolio API | Baptiste Wetterwald',
    );
    expect(socialMetadataContent('name', 'twitter:description')).toBe('Public API fixture.');
  });

  it('leaves no stale ProfilePage or social metadata on project 404 and 503 states', async () => {
    const notFoundHarness = await createHarness('/en');

    await notFoundHarness.navigateByUrl('/en/projects/missing-translation');
    await settleHarness(notFoundHarness);
    expect(managedStructuredDataScripts()).toHaveLength(0);
    expect(managedSocialMetadata()).toHaveLength(0);

    TestBed.resetTestingModule();
    const unavailableHarness = await createHarness('/fr', {
      getProject: () =>
        throwError(() => new HttpErrorResponse({ status: 503, statusText: 'Unavailable' })),
    });

    await unavailableHarness.navigateByUrl('/fr/projets/temporarily-unavailable');
    await settleHarness(unavailableHarness);
    expect(managedStructuredDataScripts()).toHaveLength(0);
    expect(managedSocialMetadata()).toHaveLength(0);
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

  it('renders GitHub activity after projects without adding a navigation section', async () => {
    const harness = await createHarness('/en', {}, { getActivity: () => of(githubActivity()) });
    const root = harness.routeNativeElement;
    const github = root?.querySelector('[data-github-activity]');
    const projects = root?.querySelector('#projects');
    const contact = root?.querySelector('#contact');

    expect(github?.closest('#home')).toBeNull();
    expect((projects as Element).compareDocumentPosition(github as Node)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect((github as Element).compareDocumentPosition(contact as Node)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(root?.querySelector('#github')).toBeNull();
    expect(root?.querySelector('nav a[href*="#github"], footer a[href*="#github"]')).toBeNull();
    expect(portfolioSectionIds(root)).toEqual([
      'home',
      'experience',
      'education',
      'projects',
      'contact',
    ]);
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
      'Expérience',
      'Formation',
      'Projets',
      'Contact',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/fr#home',
      '/fr#experience',
      '/fr#education',
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
  githubApiOverrides: Partial<GitHubActivityApiService> = {},
): Promise<RouterTestingHarness> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes),
      {
        provide: ProjectApiService,
        useValue: projectApiStub(projectApiOverrides),
      },
      {
        provide: GitHubActivityApiService,
        useValue: {
          getActivity: () => of(unavailableGitHubActivity()),
          ...githubApiOverrides,
        },
      },
    ],
  });

  TestBed.inject(RouteFocusService).initialize();

  const harness = await RouterTestingHarness.create(initialUrl);

  await settleHarness(harness);

  return harness;
}

function unavailableGitHubActivity(): GitHubActivityDto {
  return {
    available: false,
    profileUrl: null,
    repositories: [],
    contributionCalendar: null,
    lastRefreshedAt: null,
    stale: false,
  };
}

function githubActivity(): GitHubActivityDto {
  return {
    available: true,
    profileUrl: 'https://github.com/octocat',
    repositories: [
      {
        name: 'portfolio',
        url: 'https://github.com/octocat/portfolio',
        description: 'A repository fixture.',
        primaryLanguage: 'TypeScript',
        stars: 3,
        lastActivityAt: '2026-09-01T10:00:00Z',
      },
    ],
    contributionCalendar: null,
    lastRefreshedAt: '2026-09-07T10:00:00Z',
    stale: false,
  };
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

function managedStructuredDataScripts(): NodeListOf<HTMLScriptElement> {
  return document.querySelectorAll(
    'script[type="application/ld+json"][data-managed-by="page-metadata-service:structured-data"]',
  );
}

function managedSocialMetadata(): NodeListOf<HTMLMetaElement> {
  return document.querySelectorAll('meta[data-managed-by="page-metadata-service:social-sharing"]');
}

function socialMetadataContent(attribute: 'name' | 'property', key: string): string | null {
  return (
    document
      .querySelector<HTMLMetaElement>(
        `meta[${attribute}="${key}"][data-managed-by="page-metadata-service:social-sharing"]`,
      )
      ?.getAttribute('content') ?? null
  );
}

function managedStructuredData(): Record<string, unknown> {
  const scripts = managedStructuredDataScripts();

  expect(scripts).toHaveLength(1);

  return JSON.parse(scripts[0]!.textContent ?? '') as Record<string, unknown>;
}

function personFrom(profilePage: Record<string, unknown>): Record<string, unknown> {
  return profilePage['mainEntity'] as Record<string, unknown>;
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
