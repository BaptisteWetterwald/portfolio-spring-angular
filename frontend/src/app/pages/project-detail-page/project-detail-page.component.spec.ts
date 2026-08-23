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
    expect(page.textContent).toContain('Detailed plain text description.');
    expect(Array.from(page.querySelectorAll('li')).map((item) => item.textContent?.trim())).toEqual(
      ['Angular'],
    );
    expect(page.querySelector('.project-detail__status.badge')).not.toBeNull();
    expect(page.querySelector('.project-detail__technology.badge')).not.toBeNull();
    expect(
      Array.from(page.querySelectorAll<HTMLAnchorElement>('nav a')).map((link) => link.href),
    ).toEqual([
      'https://example.test/portfolio-api.git',
      'https://demo.example.test/portfolio-api',
    ]);
  });

  it('renders cleanly when detailedDescription is absent', async () => {
    const fixture = await createFixture({
      kind: 'loaded',
      project: detailProject({ detailedDescription: null }),
    });
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h1')?.textContent).toContain('Portfolio API');
    expect(page.querySelector('.project-detail__header--with-media')).toBeNull();
    expect(page.querySelector('.project-detail__description')).toBeNull();
    expect(page.textContent).not.toContain('undefined');
  });

  it('applies project metadata from the loaded DTO', async () => {
    const metadata = metadataSpy();
    const project = detailProject();

    await createFixture(
      {
        kind: 'loaded',
        project,
      },
      'fr',
      metadata,
    );

    expect(metadata.applyProjectDetail).toHaveBeenCalledWith('fr', project);
  });

  it('renders generic error state with a localized recovery link', async () => {
    const fixture = await createFixture({
      kind: 'error',
    });
    const page = fixture.nativeElement as HTMLElement;

    expect(page.textContent).toContain('Project could not be loaded');
    expect(page.querySelector<HTMLAnchorElement>('a')?.getAttribute('href')).toBe('/en/projects');
  });

  it('renders localized not-found UI and sets SSR response status', async () => {
    const responseInit: ResponseInit = { status: 200 };
    const fixture = await createFixture(
      {
        kind: 'notFound',
      },
      'fr',
      metadataSpy(),
      responseInit,
    );
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('app-not-found-page h1')?.textContent).toContain('Page introuvable');
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
  'applyProjectDetail' | 'applyStaticPage' | 'applyNotFound'
> {
  return {
    applyProjectDetail: vi.fn(),
    applyStaticPage: vi.fn(),
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
    displayOrder: 10,
    technologies: [
      {
        slug: 'angular',
        name: 'Angular',
        iconRef: null,
        category: 'framework',
      },
    ],
    availableLocales: ['en', 'fr'],
    ...overrides,
  };
}
