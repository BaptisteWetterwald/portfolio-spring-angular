import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PageMetadataService } from '../../core/metadata/page-metadata.service';
import { ProjectsPageState, ProjectSummaryDto } from '../../core/projects/project.models';
import { projectsPageStateKey } from '../../core/projects/project-resolvers';
import { ProjectsPageComponent } from './projects-page.component';

describe('ProjectsPageComponent', () => {
  it('renders featured, published, and archived project groups from route data', async () => {
    const fixture = await createFixture({
      kind: 'loaded',
      projects: [
        projectFixture('featured-project', 'Featured Project', 'PUBLISHED', true),
        projectFixture('published-project', 'Published Project', 'PUBLISHED', false),
        projectFixture('archived-project', 'Archived Project', 'ARCHIVED', false),
      ],
    });
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h1')?.textContent).toContain('Projects');
    expect(sectionText(page, 'Featured projects')).toContain('Featured Project');
    expect(sectionText(page, 'Published projects')).toContain('Published Project');
    expect(sectionText(page, 'Archive')).toContain('Archived Project');
    expect(page.querySelector('.projects-page__group--featured')).not.toBeNull();
    expect(page.querySelector('.projects-page__group--archived')).not.toBeNull();
    expect(
      page.querySelector<HTMLAnchorElement>('app-project-card h3 a')?.getAttribute('href'),
    ).toBe('/en/projects/featured-project');
  });

  it('renders a clear empty state when no public projects exist', async () => {
    const fixture = await createFixture({
      kind: 'loaded',
      projects: [],
    });
    const page = fixture.nativeElement as HTMLElement;

    expect(page.textContent).toContain('No public projects yet');
    expect(page.querySelector('app-project-card')).toBeNull();
  });

  it('renders a generic API failure state without raw server details', async () => {
    const fixture = await createFixture({
      kind: 'error',
    });
    const page = fixture.nativeElement as HTMLElement;

    expect(page.textContent).toContain('Projects could not be loaded');
    expect(page.textContent).toContain('The project API is temporarily unavailable.');
    expect(page.textContent).not.toContain('500');
  });

  it('applies localized static project metadata', async () => {
    const metadata = {
      applyStaticPage: vi.fn(),
    };

    await createFixture(
      {
        kind: 'loaded',
        projects: [],
      },
      'fr',
      metadata,
    );

    expect(metadata.applyStaticPage).toHaveBeenCalledWith('projects', 'fr');
  });
});

async function createFixture(
  state: ProjectsPageState,
  locale: 'fr' | 'en' = 'en',
  metadata: Partial<PageMetadataService> = { applyStaticPage: vi.fn() },
): Promise<ComponentFixture<ProjectsPageComponent>> {
  await TestBed.configureTestingModule({
    imports: [ProjectsPageComponent],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          data: of({ [projectsPageStateKey]: state }),
          snapshot: {
            data: { [projectsPageStateKey]: state },
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
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ProjectsPageComponent);

  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return fixture;
}

function sectionText(page: HTMLElement, heading: string): string {
  const headingElement = Array.from(page.querySelectorAll('h2')).find((element) =>
    element.textContent?.includes(heading),
  );

  return headingElement?.closest('section')?.textContent ?? '';
}

function projectFixture(
  slug: string,
  title: string,
  status: ProjectSummaryDto['status'],
  featured: boolean,
): ProjectSummaryDto {
  return {
    slug,
    title,
    shortDescription: `${title} short description.`,
    logoMediaRef: null,
    githubUrl: null,
    demoUrl: null,
    featured,
    status,
    displayOrder: 10,
    technologies: [],
  };
}
