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

    expect(page.querySelector('h2')?.textContent).toContain('Projects');
    expect(sectionText(page, 'Featured projects')).toContain('Featured Project');
    expect(sectionText(page, 'Published projects')).toContain('Published Project');
    expect(sectionText(page, 'Archive')).toContain('Archived Project');
    expect(page.querySelector('.projects-page__group--featured')).not.toBeNull();
    expect(page.querySelector('.projects-page__group--archived')).not.toBeNull();
    expect(
      page
        .querySelector<HTMLAnchorElement>('app-project-card .project-card__action--detail')
        ?.getAttribute('href'),
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

  it('renders the English project introduction without placeholder wording', async () => {
    const fixture = await createFixture({
      kind: 'loaded',
      projects: [],
    });
    const page = fixture.nativeElement as HTMLElement;

    expect(page.textContent).toContain(
      'A selection of personal and academic projects showcasing the technologies and software architectures I have worked with.',
    );
    expect(page.textContent).not.toContain('will appear here');
  });

  it('renders the French project introduction without placeholder wording', async () => {
    const fixture = await createFixture(
      {
        kind: 'loaded',
        projects: [],
      },
      'fr',
    );
    const page = fixture.nativeElement as HTMLElement;

    expect(page.textContent).toContain(
      "Une sélection de projets personnels et académiques illustrant les technologies et architectures avec lesquelles j'ai travaillé.",
    );
    expect(page.textContent).not.toContain('apparaîtront ici');
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

  it('exposes the stable projects section anchor and heading relationship', async () => {
    const fixture = await createFixture({ kind: 'loaded', projects: [] }, 'fr');
    const section = (fixture.nativeElement as HTMLElement).querySelector('#projects');
    const permalink = section?.querySelector<HTMLAnchorElement>('[data-section-permalink]');

    expect(section?.hasAttribute('data-portfolio-section')).toBe(true);
    expect(section?.getAttribute('aria-labelledby')).toBe('projects-title');
    expect(section?.querySelector('h2')?.id).toBe('projects-title');
    expect(permalink?.getAttribute('href')).toBe('/fr#projects');
    expect(permalink?.getAttribute('aria-label')).toBe('Lien vers la section Projets');
    expect(permalink?.closest('h2')).toBeNull();
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
  const headingElement = Array.from(page.querySelectorAll('h3')).find((element) =>
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
    presentationMode: 'DETAIL',
    displayOrder: 10,
    technologies: [],
  };
}
