import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import {
  GitHubActivityState,
  GitHubContributionCalendarDto,
} from '../../core/github/github-activity.models';
import { githubActivityStateKey } from '../../core/github/github-activity.resolver';
import { PageMetadataService } from '../../core/metadata/page-metadata.service';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  it('renders the real English identity and primary positioning', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h1')?.textContent).toContain('Baptiste Wetterwald');
    expect(page.textContent).toContain('Software Engineer');
    expect(page.textContent).toContain('Backend & Full-stack');
    expect(primaryStack(page)).toEqual([
      'Java / Spring',
      'C# / .NET',
      'TypeScript / Node.js',
      'Angular',
    ]);
  });

  it('renders the real French identity and equivalent positioning facts', async () => {
    const fixture = await createFixture('fr');
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h1')?.textContent).toContain('Baptiste Wetterwald');
    expect(page.textContent).toContain('Ingénieur logiciel');
    expect(page.textContent).toContain('Backend & full-stack');
    expect(page.textContent).toContain('Java / Spring');
    expect(page.textContent).toContain('C# / .NET');
    expect(page.textContent).toContain('TypeScript / Node.js');
    expect(page.textContent).toContain('Angular');
  });

  it('renders the provided portrait source without fake social profile links', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const links = Array.from(page.querySelectorAll<HTMLAnchorElement>('a'));
    const portraitSlot = page.querySelector('[data-portrait-slot]');
    const portraitFrame = portraitSlot?.querySelector('.home-page__portrait-photo-frame');
    const portrait = portraitSlot?.querySelector('img');

    expect(portraitSlot).not.toBeNull();
    expect(portraitFrame).not.toBeNull();
    expect(portraitSlot?.querySelector('.home-page__portrait-ring')).toBeNull();
    expect(portrait?.getAttribute('src')).toBe('/assets/portrait/baptiste-wetterwald-portrait.png');
    expect(portrait?.getAttribute('alt')).toBe('Portrait of Baptiste Wetterwald');
    expect(portrait?.getAttribute('width')).toBe('4916');
    expect(portrait?.getAttribute('height')).toBe('7370');
    expect(links.some((link) => (link.getAttribute('href') ?? '').includes('github'))).toBe(false);
    expect(links.some((link) => (link.getAttribute('href') ?? '').includes('linkedin'))).toBe(
      false,
    );
  });

  it('localizes the portrait alternative text', async () => {
    const fixture = await createFixture('fr');
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('[data-portrait-slot] img')?.getAttribute('alt')).toBe(
      'Portrait de Baptiste Wetterwald',
    );
  });

  it.each([
    ['en', 'Continue through the portfolio'],
    ['fr', 'Parcourir le portfolio'],
  ] as const)(
    'does not render the redundant %s portfolio navigation card section',
    async (locale, heading) => {
      const fixture = await createFixture(locale);
      const page = fixture.nativeElement as HTMLElement;
      const text = page.textContent ?? '';

      expect(text).not.toContain(heading);
      expect(text).not.toContain('Professional experience');
      expect(text).not.toContain('Parcours professionnel');
      expect(page.querySelector('.home-page__explore-link')).toBeNull();
    },
  );

  it('renders the approved skill groups without percentage metrics', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const text = page.textContent ?? '';

    expect(text).toContain('Software Engineering');
    expect(text).toContain('Data & Databases');
    expect(text).toContain('Enterprise & Industrial Software');
    expect(text).toContain('AI-assisted Engineering');
    expect(text).toContain('Broader Software Experience');
    expect(text).toContain('Exploratory & Historical');
    expect(text).toContain('Spring Boot');
    expect(text).toContain('OAuth 2.0');
    expect(text).toContain('Sockets');
    expect(text).toContain('SAP S/4HANA');
    expect(text).toContain('ABAP');
    expect(text).toContain('LabVIEW');
    expect(text).toContain('PostgreSQL');
    expect(text).toContain('Spring Boot / PostgreSQL');
    expect(text).toContain('Codex / coding agents');
    expect(text).toContain('MCP concepts');
    expect(skillBadgeLabels(page)).toContain('Sockets');
    expect(skillBadgeLabels(page)).not.toContain('sockets');
    expect(text).not.toMatch(/\b\d{1,3}%\b/);
    expect(text).not.toContain('PCF');
    expect(text).not.toContain('Custom Connectors');
    expect(text).not.toContain('AI Engineer');
    expect(text).not.toContain('ML Engineer');
    expect(text).not.toContain('LLM Engineer');
  });

  it('renders skill group importance hooks for the visible hierarchy', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const groups = Array.from(page.querySelectorAll<HTMLElement>('.home-page__skill-group'));

    expect(groups.map((group) => group.dataset['skillImportance'])).toEqual([
      'primary',
      'professional-complementary',
      'professional-complementary',
      'secondary',
      'secondary',
      'exploratory-historical',
    ]);
    expect(groups[0].classList.contains('home-page__skill-group--primary')).toBe(true);
    expect(groups[1].classList.contains('home-page__skill-group--professional-complementary')).toBe(
      true,
    );
    expect(groups[2].classList.contains('home-page__skill-group--professional-complementary')).toBe(
      true,
    );
    expect(groups[3].classList.contains('home-page__skill-group--secondary')).toBe(true);
    expect(groups[4].classList.contains('home-page__skill-group--secondary')).toBe(true);
    expect(groups[5].classList.contains('home-page__skill-group--exploratory-historical')).toBe(
      true,
    );
  });

  it('uses daisyUI primitives without fake navigation interactivity in skills', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('.aura')).toBeNull();
    expect(page.querySelectorAll('.home-page__primary-stack .badge').length).toBe(4);
    expect(page.querySelectorAll('.home-page__skill-group.card').length).toBe(6);
    expect(page.querySelectorAll('.home-page__skill-badge.badge').length).toBeGreaterThan(0);
    expect(page.querySelector('.home-page__skill-group a')).toBeNull();
    expect(page.querySelector('.home-page__skill-group button')).toBeNull();
  });

  it('renders languages as factual secondary content without progress bars', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;
    const text = page.textContent ?? '';

    expect(text).toContain('Languages');
    expect(text).toContain('French');
    expect(text).toContain('Native language');
    expect(text).toContain('English');
    expect(text).toContain('C1');
    expect(text).toContain('TOEIC 975');
    expect(text).toContain('German');
    expect(text).toContain('B1');
    expect(page.querySelectorAll('.home-page__language-card.card').length).toBe(3);
    expect(page.querySelector('progress')).toBeNull();
    expect(page.querySelector('[role="progressbar"]')).toBeNull();
  });

  it.each([
    [
      'en',
      'GitHub activity',
      'A snapshot of my public development activity on GitHub.',
      'Public repositories',
      'View GitHub profile',
      'Last activity:',
      '18 contributions',
    ],
    [
      'fr',
      'Activité GitHub',
      'Un aperçu de mon activité de développement publique sur GitHub.',
      'Dépôts publics',
      'Voir le profil GitHub',
      'Dernière activité :',
      '18 contributions',
    ],
  ] as const)(
    'renders localized %s GitHub activity with safe external-link semantics',
    async (
      locale,
      heading,
      introduction,
      repositoriesLabel,
      profileLabel,
      activityLabel,
      contributionLabel,
    ) => {
      const fixture = await createFixture(locale, undefined, availableGitHubState());
      const page = fixture.nativeElement as HTMLElement;
      const block = page.querySelector('[data-github-activity]');
      const repositoryLink = block?.querySelector<HTMLAnchorElement>(
        '.home-page__github-repository-name a',
      );
      const profileLink = block?.querySelector<HTMLAnchorElement>(
        '.home-page__github-profile-link',
      );

      expect(block?.querySelector('h2')?.textContent).toContain(heading);
      expect(block?.textContent).toContain(introduction);
      expect(block?.querySelector('.home-page__github-repositories-title')?.textContent).toContain(
        repositoriesLabel,
      );
      expect(block?.textContent).toContain(
        'repository-with-a-very-long-name-for-responsive-testing',
      );
      expect(block?.textContent).toContain(profileLabel);
      expect(block?.textContent).toContain(activityLabel);
      expect(block?.textContent).toContain(contributionLabel);
      expect(block?.querySelector('[data-github-contribution-calendar]')).not.toBeNull();
      expect(block?.querySelector('.home-page__github-metadata')).not.toBeNull();
      expect(block?.querySelector('time')?.getAttribute('datetime')).toBe('2026-09-01T10:00:00Z');
      expect(repositoryLink?.getAttribute('target')).toBe('_blank');
      expect(repositoryLink?.getAttribute('rel')).toBe('noopener noreferrer');
      expect(repositoryLink?.getAttribute('href')).toBe(
        'https://github.com/octocat/repository-with-a-very-long-name-for-responsive-testing',
      );
      expect(profileLink?.getAttribute('target')).toBe('_blank');
      expect(profileLink?.getAttribute('rel')).toBe('noopener noreferrer');
      expect(profileLink?.getAttribute('href')).toBe('https://github.com/octocat');
    },
  );

  it('places GitHub after the existing skills and languages content without creating a primary section', async () => {
    const fixture = await createFixture('en', undefined, availableGitHubState());
    const page = fixture.nativeElement as HTMLElement;
    const home = page.querySelector('#home');
    const github = home?.querySelector('[data-github-activity]');
    const languages = home?.querySelector('[aria-labelledby="home-languages-title"]');

    expect(github).not.toBeNull();
    expect(languages).not.toBeNull();
    expect(
      (languages as Element).compareDocumentPosition(github as Node) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(github?.hasAttribute('data-portfolio-section')).toBe(false);
    expect(github?.id).toBe('');
    expect(page.querySelector('#github')).toBeNull();
  });

  it('degrades quietly when GitHub is unavailable or has no validated repository data', async () => {
    const fixture = await createFixture('en');
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('[data-github-activity]')).toBeNull();
    expect(page.querySelector('#home-title')?.textContent).toContain('Baptiste Wetterwald');
    expect(page.querySelector('#home-languages-title')).not.toBeNull();
  });

  it('keeps repository activity available when the contribution calendar is unavailable', async () => {
    const fixture = await createFixture('en', undefined, availableGitHubState(null));
    const page = fixture.nativeElement as HTMLElement;
    const block = page.querySelector('[data-github-activity]');

    expect(block).not.toBeNull();
    expect(block?.querySelector('[data-github-contribution-calendar]')).toBeNull();
    expect(block?.textContent).toContain('A selection of my public repositories on GitHub.');
    expect(block?.textContent).toContain('repository-with-a-very-long-name-for-responsive-testing');
  });

  it('uses natural French labels for skill groups and AI-assisted tooling', async () => {
    const fixture = await createFixture('fr');
    const page = fixture.nativeElement as HTMLElement;
    const text = page.textContent ?? '';

    expect(text).toContain('Développement logiciel');
    expect(text).toContain('Développement assisté par IA');
    expect(text).toContain('développement logiciel');
    expect(text).toContain('Langues');
    expect(text).toContain('Langue maternelle');
    expect(text).not.toContain('software engineering');
    expect(text).not.toContain('workflows');
  });

  it('exposes the stable home section anchor around the existing hero', async () => {
    const fixture = await createFixture('fr');
    const section = (fixture.nativeElement as HTMLElement).querySelector('#home');
    const permalink = section?.querySelector<HTMLAnchorElement>('[data-section-permalink]');

    expect(section?.hasAttribute('data-portfolio-section')).toBe(true);
    expect(section?.getAttribute('aria-labelledby')).toBe('home-title');
    expect(section?.querySelector('.home-page__hero')).toBeInstanceOf(HTMLElement);
    expect(permalink?.getAttribute('href')).toBe('/fr#home');
    expect(permalink?.getAttribute('aria-label')).toBe('Lien vers la section Accueil');
    expect(permalink?.closest('.home-page__eyebrow-row')).not.toBeNull();
    expect(permalink?.closest('h1')).toBeNull();
  });
});

async function createFixture(
  locale: 'fr' | 'en',
  metadata: Partial<PageMetadataService> | undefined = { applyStaticPage: vi.fn() },
  githubState: GitHubActivityState = { kind: 'unavailable' },
): Promise<ComponentFixture<HomePageComponent>> {
  await TestBed.configureTestingModule({
    imports: [HomePageComponent],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: { [githubActivityStateKey]: githubState },
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
        useValue: metadata ?? { applyStaticPage: vi.fn() },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(HomePageComponent);

  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return fixture;
}

function availableGitHubState(
  contributionCalendar: GitHubContributionCalendarDto | null = {
    totalContributions: 18,
    startsOn: '2026-09-06',
    endsOn: '2026-09-12',
    days: [
      { date: '2026-09-06', contributionCount: 0 },
      { date: '2026-09-07', contributionCount: 1 },
      { date: '2026-09-08', contributionCount: 2 },
      { date: '2026-09-09', contributionCount: 3 },
      { date: '2026-09-10', contributionCount: 5 },
      { date: '2026-09-11', contributionCount: 7 },
      { date: '2026-09-12', contributionCount: 0 },
    ],
  },
): GitHubActivityState {
  return {
    kind: 'available',
    activity: {
      available: true,
      profileUrl: 'https://github.com/octocat',
      repositories: [
        {
          name: 'repository-with-a-very-long-name-for-responsive-testing',
          url: 'https://github.com/octocat/repository-with-a-very-long-name-for-responsive-testing',
          description:
            'A deliberately long repository description used to verify compact responsive wrapping without horizontal overflow.',
          primaryLanguage: 'TypeScript',
          stars: 7,
          lastActivityAt: '2026-09-01T10:00:00Z',
        },
      ],
      contributionCalendar,
      lastRefreshedAt: '2026-09-07T10:00:00Z',
      stale: false,
    },
  };
}

function primaryStack(page: HTMLElement): string[] {
  return Array.from(page.querySelectorAll('.home-page__primary-stack li')).map(
    (element) => element.textContent?.trim() ?? '',
  );
}

function skillBadgeLabels(page: HTMLElement): string[] {
  return Array.from(page.querySelectorAll('.home-page__skill-badge')).map(
    (element) => element.textContent?.trim() ?? '',
  );
}
