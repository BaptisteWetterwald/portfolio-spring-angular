import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import {
  GitHubActivityState,
  GitHubContributionCalendarDto,
} from '../../core/github/github-activity.models';
import { githubActivityStateKey } from '../../core/github/github-activity.resolver';
import { PageMetadataService } from '../../core/metadata/page-metadata.service';
import { GitHubActivityComponent } from './github-activity.component';

describe('GitHubActivityComponent', () => {
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
      const repositories = block!.querySelector('.home-page__github-grid')!;
      const calendar = block!.querySelector('app-github-contribution-calendar')!;
      expect(
        repositories.compareDocumentPosition(calendar) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
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

  it('keeps repository activity available when the contribution calendar is unavailable', async () => {
    const fixture = await createFixture('en', undefined, availableGitHubState(null));
    const page = fixture.nativeElement as HTMLElement;
    const block = page.querySelector('[data-github-activity]');

    expect(block).not.toBeNull();
    expect(block?.querySelector('[data-github-contribution-calendar]')).toBeNull();
    expect(block?.textContent).toContain('A selection of my public repositories on GitHub.');
    expect(block?.textContent).toContain('repository-with-a-very-long-name-for-responsive-testing');
  });

  it('does not introduce a primary navigation section', async () => {
    const fixture = await createFixture('en', undefined, availableGitHubState());
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('[data-github-activity]')).not.toBeNull();
    expect(page.querySelector('[data-portfolio-section]')).toBeNull();
    expect(page.querySelector('h1')).toBeNull();
  });
  it('omits unavailable activity', async () => {
    const fixture = await createFixture('en');
    expect(fixture.nativeElement.querySelector('[data-github-activity]')).toBeNull();
  });
});
async function createFixture(
  locale: 'fr' | 'en',
  metadata: Partial<PageMetadataService> | undefined = { applyStaticPage: vi.fn() },
  githubState: GitHubActivityState = { kind: 'unavailable' },
): Promise<ComponentFixture<GitHubActivityComponent>> {
  await TestBed.configureTestingModule({
    imports: [GitHubActivityComponent],
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

  const fixture = TestBed.createComponent(GitHubActivityComponent);

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
