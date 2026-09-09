import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { lastValueFrom, Observable, of, throwError } from 'rxjs';

import { GitHubActivityApiService } from './github-activity-api.service';
import { GitHubActivityDto } from './github-activity.models';
import {
  githubActivityResolver,
  githubActivityStateFromRouteData,
} from './github-activity.resolver';

describe('GitHub activity resolver', () => {
  it('loads and validates an available activity response', async () => {
    const activity = availableActivity();

    configureApi(() => of(activity));

    await expect(resolveActivity()).resolves.toEqual({ kind: 'available', activity });
  });

  it('converts controlled unavailable and empty responses to a quiet unavailable state', async () => {
    configureApi(() =>
      of({
        available: false,
        profileUrl: null,
        repositories: [],
        contributionCalendar: null,
        lastRefreshedAt: null,
        stale: false,
      }),
    );

    await expect(resolveActivity()).resolves.toEqual({ kind: 'unavailable' });
  });

  it('converts API failures to a quiet unavailable state', async () => {
    configureApi(() => throwError(() => new Error('network')));

    await expect(resolveActivity()).resolves.toEqual({ kind: 'unavailable' });
  });

  it('rejects malformed or non-GitHub response URLs at the route boundary', () => {
    expect(
      githubActivityStateFromRouteData({
        kind: 'available',
        activity: { ...availableActivity(), profileUrl: 'https://example.test/octocat' },
      }),
    ).toEqual({ kind: 'unavailable' });
    expect(githubActivityStateFromRouteData(undefined)).toEqual({ kind: 'unavailable' });
  });

  it('accepts a valid contribution calendar even when repository activity is unavailable', async () => {
    const activity: GitHubActivityDto = {
      ...availableActivity(),
      repositories: [],
      contributionCalendar: contributionCalendar(),
    };

    configureApi(() => of(activity));

    await expect(resolveActivity()).resolves.toEqual({ kind: 'available', activity });
  });

  it('rejects malformed contribution ranges at the route boundary', () => {
    expect(
      githubActivityStateFromRouteData({
        kind: 'available',
        activity: {
          ...availableActivity(),
          repositories: [],
          contributionCalendar: { ...contributionCalendar(), endsOn: '2026-09-09' },
        },
      }),
    ).toEqual({ kind: 'unavailable' });
  });
});

function configureApi(getActivity: () => Observable<GitHubActivityDto>): void {
  TestBed.configureTestingModule({
    providers: [{ provide: GitHubActivityApiService, useValue: { getActivity } }],
  });
}

function resolveActivity(): Promise<unknown> {
  return runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
    lastValueFrom(
      githubActivityResolver(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ) as Observable<unknown>,
    ),
  );
}

function availableActivity(): GitHubActivityDto {
  return {
    available: true,
    profileUrl: 'https://github.com/octocat',
    repositories: [
      {
        name: 'portfolio',
        url: 'https://github.com/octocat/portfolio',
        description: 'A repository fixture.',
        primaryLanguage: 'TypeScript',
        stars: 2,
        lastActivityAt: '2026-09-01T10:00:00Z',
      },
    ],
    contributionCalendar: null,
    lastRefreshedAt: '2026-09-07T10:00:00Z',
    stale: false,
  };
}

function contributionCalendar() {
  return {
    totalContributions: 3,
    startsOn: '2026-09-07',
    endsOn: '2026-09-08',
    days: [
      { date: '2026-09-07', contributionCount: 0 },
      { date: '2026-09-08', contributionCount: 3 },
    ],
  } as const;
}
