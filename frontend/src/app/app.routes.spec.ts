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

  it('resolves /fr to the French home page content', async () => {
    const harness = await createHarness('/fr');

    expect(harness.routeNativeElement?.querySelector('app-home-page h1')?.textContent).toContain(
      'Baptiste Wetterwald',
    );
    expect(harness.routeNativeElement?.textContent).toContain('Ingénieur logiciel');
  });

  it('resolves /en to the English home page content', async () => {
    const harness = await createHarness('/en');

    expect(harness.routeNativeElement?.querySelector('app-home-page h1')?.textContent).toContain(
      'Baptiste Wetterwald',
    );
    expect(harness.routeNativeElement?.textContent).toContain('Software Engineer');
  });

  it('resolves localized education aliases to the education page component', async () => {
    const harness = await createHarness('/fr/formation');

    expect(
      harness.routeNativeElement?.querySelector('app-education-page h1')?.textContent,
    ).toContain('Formation');
    expect(harness.routeNativeElement?.textContent).toContain('ENSISA');

    await harness.navigateByUrl('/en/education');

    expect(
      harness.routeNativeElement?.querySelector('app-education-page h1')?.textContent,
    ).toContain('Education');
    expect(harness.routeNativeElement?.textContent).toContain('IUT Robert Schuman');
  });

  it('resolves localized experience routes to the experience page component', async () => {
    const harness = await createHarness('/en/experience');

    expect(
      harness.routeNativeElement?.querySelector('app-experience-page h1')?.textContent,
    ).toContain('Professional experience');
    expect(harness.routeNativeElement?.textContent).toContain('Plansee Group Functions');
  });

  it('resolves localized projects routes to the API-backed projects page', async () => {
    const harness = await createHarness('/en/projects', {
      listProjects: () => of([summaryProject()]),
    });

    expect(
      harness.routeNativeElement?.querySelector('app-projects-page h1')?.textContent,
    ).toContain('Projects');
    expect(harness.routeNativeElement?.textContent).toContain('Portfolio API');
  });

  it('resolves localized contact routes to the contact page component', async () => {
    const harness = await createHarness('/fr/contact');

    expect(harness.routeNativeElement?.querySelector('app-contact-page h1')?.textContent).toContain(
      'Contact',
    );
    expect(harness.routeNativeElement?.querySelector('form')).toBeNull();
  });

  it('resolves localized project detail routes with shared slugs', async () => {
    const harness = await createHarness('/fr/projets/portfolio-api', {
      getProject: () => of(detailProject()),
    });

    expect(
      harness.routeNativeElement?.querySelector('app-project-detail-page h1')?.textContent,
    ).toContain('Portfolio API');
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

  it('renders the public shell landmarks around localized pages', async () => {
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

  it('renders localized primary navigation links from the shared route model', async () => {
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
      '/fr',
      '/fr/formation',
      '/fr/experience',
      '/fr/projets',
      '/fr/contact',
    ]);
  });

  it('uses exact aria-current page semantics for static navigation links', async () => {
    const harness = await createHarness('/fr/projets');

    await settleHarness(harness);
    expect(navLink(harness, 'Projets')?.getAttribute('aria-current')).toBe('page');

    await harness.navigateByUrl('/fr/projets/inconnu');

    await settleHarness(harness);
    expect(
      harness.routeNativeElement?.querySelector('app-not-found-page h1')?.textContent,
    ).toContain('Page introuvable');
    expect(
      harness.routeNativeElement
        ?.querySelector<HTMLAnchorElement>('app-not-found-page a')
        ?.getAttribute('href'),
    ).toBe('/fr/projets');
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
