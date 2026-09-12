import { RESPONSE_INIT } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PageMetadataService } from '../../core/metadata/page-metadata.service';
import { ProjectDetailDto, ProjectDetailPageState } from '../../core/projects/project.models';
import { projectDetailStateKey } from '../../core/projects/project-resolvers';
import { ProjectDetailPageComponent } from './project-detail-page.component';

describe('ProjectDetailPageComponent', () => {
  it('renders available project detail fields from route data', async () => {
    const fixture = await createFixture({
      kind: 'loaded',
      project: detailProject({
        detailedDescription: 'Detailed plain text description.',
        githubUrl: 'https://example.test/portfolio-api.git',
        demoUrl: 'https://demo.example.test/portfolio-api',
      }),
    });
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('article')).not.toBeNull();
    expect(page.querySelector('h1')?.textContent).toContain('Portfolio API');
    expect(page.textContent).toContain('A public API fixture.');
    expect(page.textContent).toContain('Technical overview');
    expect(page.textContent).toContain('Context');
    expect(page.textContent).toContain('Architecture');
    expect(page.textContent).toContain('Context section body.');
    expect(page.textContent).not.toContain('Detailed plain text description.');
    expect(
      Array.from(page.querySelectorAll('.project-detail__technologies li')).map((item) =>
        item.textContent?.trim(),
      ),
    ).toEqual(['Angular']);
    expect(page.querySelector('.project-detail__status.badge')).toBeNull();
    expect(page.querySelector('.project-detail__technology.badge')).not.toBeNull();
    expect(page.querySelector('.project-detail__actions')?.tagName).toBe('DIV');
    expect(page.querySelector('.project-detail__actions')?.getAttribute('role')).toBeNull();
    expect(page.querySelector('.project-detail__actions nav')).toBeNull();
    expect(
      Array.from(page.querySelectorAll<HTMLAnchorElement>('.project-detail__actions a')).map(
        (link) => link.href,
      ),
    ).toEqual([
      'https://example.test/portfolio-api.git',
      'https://demo.example.test/portfolio-api',
    ]);
    expect(
      page
        .querySelector<HTMLAnchorElement>('.project-detail__actions a')
        ?.getAttribute('aria-label'),
    ).toBe('GitHub (opens in a new tab): Portfolio API');
  });

  it('renders an archived badge when historical context is meaningful', async () => {
    const fixture = await createFixture({
      kind: 'loaded',
      project: detailProject({ status: 'ARCHIVED' }),
    });
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('.project-detail__status.badge')?.textContent).toContain('Archived');
  });

  it('renders detailedDescription only as a fallback when structured sections are absent', async () => {
    const fixture = await createFixture({
      kind: 'loaded',
      project: detailProject({
        detailedDescription: 'Legacy detailed description.',
        sections: [],
      }),
    });
    const page = fixture.nativeElement as HTMLElement;

    expect(page.textContent).toContain('Project details');
    expect(page.textContent).toContain('Legacy detailed description.');
    expect(page.querySelector('.project-detail__sections')).toBeNull();
  });

  it('renders cleanly when detailedDescription and media are absent', async () => {
    const fixture = await createFixture({
      kind: 'loaded',
      project: detailProject({ detailedDescription: null, sections: [] }),
    });
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h1')?.textContent).toContain('Portfolio API');
    expect(page.querySelector('.project-detail__overview')).not.toBeNull();
    expect(page.querySelector('.project-detail__media-frame')).toBeNull();
    expect(page.querySelector('.project-detail__description')).toBeNull();
    expect(page.textContent).not.toContain('undefined');
  });

  it('keeps semantic heading order for structured sections', async () => {
    const fixture = await createFixture({
      kind: 'loaded',
      project: detailProject(),
    });
    const page = fixture.nativeElement as HTMLElement;
    const headings = Array.from(page.querySelectorAll('h1, h2')).map(
      (heading) => `${heading.tagName}:${heading.textContent?.trim()}`,
    );

    expect(headings).toEqual([
      'H1:Portfolio API',
      'H2:Technical overview',
      'H2:Context',
      'H2:Architecture',
    ]);
  });

  it('does not nest interactive controls inside other interactive controls', async () => {
    const fixture = await createFixture({
      kind: 'loaded',
      project: detailProject({
        githubUrl: 'https://example.test/portfolio-api.git',
        demoUrl: 'https://demo.example.test/portfolio-api',
      }),
    });
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('a a')).toBeNull();
    expect(page.querySelector('button a')).toBeNull();
    expect(page.querySelector('a button')).toBeNull();
  });

  it('applies project metadata from the loaded DTO', async () => {
    const metadata = metadataSpy();
    const project = detailProject();
    const responseInit: ResponseInit = { status: 200 };

    await createFixture(
      {
        kind: 'loaded',
        project,
      },
      'fr',
      metadata,
      responseInit,
    );

    expect(metadata.applyProjectDetail).toHaveBeenCalledWith('fr', project);
    expect(responseInit.status).toBe(200);
  });

  it('renders generic error state, applies safe metadata, and sets SSR status 503', async () => {
    const metadata = metadataSpy();
    const responseInit: ResponseInit = { status: 200 };
    const fixture = await createFixture(
      {
        kind: 'error',
      },
      'en',
      metadata,
      responseInit,
    );
    const page = fixture.nativeElement as HTMLElement;

    expect(page.textContent).toContain('Project could not be loaded');
    expect(page.querySelector<HTMLAnchorElement>('a')?.getAttribute('href')).toBe('/en#projects');
    expect(metadata.applyProjectUnavailable).toHaveBeenCalledWith('en', '/');
    expect(metadata.applyProjectDetail).not.toHaveBeenCalled();
    expect(responseInit.status).toBe(503);
  });

  it('renders localized not-found UI and sets SSR response status', async () => {
    const responseInit: ResponseInit = { status: 200 };
    const metadata = metadataSpy();
    const fixture = await createFixture(
      {
        kind: 'notFound',
      },
      'fr',
      metadata,
      responseInit,
    );
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('app-not-found-page h1')?.textContent).toContain('Page introuvable');
    expect(metadata.applyNotFound).toHaveBeenCalled();
    expect(metadata.applyProjectDetail).not.toHaveBeenCalled();
    expect(metadata.applyProjectUnavailable).not.toHaveBeenCalled();
    expect(responseInit.status).toBe(404);
  });
});

async function createFixture(
  state: ProjectDetailPageState,
  locale: 'fr' | 'en' = 'en',
  metadata: Partial<PageMetadataService> = metadataSpy(),
  responseInit?: ResponseInit,
): Promise<ComponentFixture<ProjectDetailPageComponent>> {
  await TestBed.configureTestingModule({
    imports: [ProjectDetailPageComponent],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          data: of({ [projectDetailStateKey]: state }),
          snapshot: {
            data: { [projectDetailStateKey]: state },
          },
          parent: {
            snapshot: {
              data: { locale },
            },
          },
        },
      },
      {
        provide: PageMetadataService,
        useValue: metadata,
      },
      ...(responseInit ? [{ provide: RESPONSE_INIT, useValue: responseInit }] : []),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ProjectDetailPageComponent);

  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return fixture;
}

function metadataSpy(): Pick<
  PageMetadataService,
  'applyProjectDetail' | 'applyProjectUnavailable' | 'applyNotFound'
> {
  return {
    applyProjectDetail: vi.fn(),
    applyProjectUnavailable: vi.fn(),
    applyNotFound: vi.fn(),
  };
}

function detailProject(overrides: Partial<ProjectDetailDto> = {}): ProjectDetailDto {
  return {
    slug: 'portfolio-api',
    title: 'Portfolio API',
    shortDescription: 'A public API fixture.',
    detailedDescription: 'Detailed description.',
    logoMediaRef: null,
    githubUrl: null,
    demoUrl: null,
    featured: true,
    status: 'PUBLISHED',
    presentationMode: 'DETAIL',
    displayOrder: 10,
    technologies: [
      {
        slug: 'angular',
        name: 'Angular',
        iconRef: null,
        category: 'framework',
      },
    ],
    sections: [
      {
        title: 'Context',
        content: 'Context section body.',
      },
      {
        title: 'Architecture',
        content: 'Architecture section body.',
      },
    ],
    availableLocales: ['en', 'fr'],
    ...overrides,
  };
}
