import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { GitHubActivityApiService } from './github-activity-api.service';
import {
  GitHubActivityDto,
  GitHubActivityState,
  GitHubContributionCalendarDto,
  GitHubContributionDayDto,
  GitHubRepositoryActivityDto,
} from './github-activity.models';

export const githubActivityStateKey = 'githubActivityState';

export const githubActivityResolver: ResolveFn<GitHubActivityState> = () =>
  inject(GitHubActivityApiService)
    .getActivity()
    .pipe(
      map(githubActivityStateFromDto),
      catchError(() => of({ kind: 'unavailable' } satisfies GitHubActivityState)),
    );

export function githubActivityStateFromRouteData(value: unknown): GitHubActivityState {
  return isObject(value) && value['kind'] === 'available' && isActivity(value['activity'])
    ? { kind: 'available', activity: value['activity'] }
    : { kind: 'unavailable' };
}

function githubActivityStateFromDto(activity: GitHubActivityDto): GitHubActivityState {
  return isActivity(activity) &&
    activity.available &&
    (activity.repositories.length > 0 || activity.contributionCalendar !== null)
    ? { kind: 'available', activity }
    : { kind: 'unavailable' };
}

function isActivity(value: unknown): value is GitHubActivityDto & {
  readonly profileUrl: string;
  readonly repositories: readonly GitHubRepositoryActivityDto[];
} {
  return (
    isObject(value) &&
    value['available'] === true &&
    isHttpsGitHubUrl(value['profileUrl']) &&
    Array.isArray(value['repositories']) &&
    value['repositories'].every(isRepository) &&
    (value['contributionCalendar'] === null ||
      isContributionCalendar(value['contributionCalendar'])) &&
    (value['repositories'].length > 0 || value['contributionCalendar'] !== null) &&
    (value['lastRefreshedAt'] === null || isIsoInstant(value['lastRefreshedAt'])) &&
    typeof value['stale'] === 'boolean'
  );
}

function isContributionCalendar(value: unknown): value is GitHubContributionCalendarDto {
  if (
    !isObject(value) ||
    typeof value['totalContributions'] !== 'number' ||
    !Number.isInteger(value['totalContributions']) ||
    value['totalContributions'] < 0 ||
    !isIsoDate(value['startsOn']) ||
    !isIsoDate(value['endsOn']) ||
    !Array.isArray(value['days']) ||
    value['days'].length === 0 ||
    value['days'].length > 400 ||
    !value['days'].every(isContributionDay)
  ) {
    return false;
  }

  const days = value['days'] as readonly GitHubContributionDayDto[];

  return (
    days[0]?.date === value['startsOn'] &&
    days.at(-1)?.date === value['endsOn'] &&
    days.every((day, index) => index === 0 || day.date > days[index - 1]!.date)
  );
}

function isContributionDay(value: unknown): value is GitHubContributionDayDto {
  return (
    isObject(value) &&
    isIsoDate(value['date']) &&
    typeof value['contributionCount'] === 'number' &&
    Number.isInteger(value['contributionCount']) &&
    value['contributionCount'] >= 0
  );
}

function isRepository(value: unknown): value is GitHubRepositoryActivityDto {
  return (
    isObject(value) &&
    typeof value['name'] === 'string' &&
    value['name'].trim().length > 0 &&
    isHttpsGitHubUrl(value['url']) &&
    (value['description'] === null || typeof value['description'] === 'string') &&
    (value['primaryLanguage'] === null || typeof value['primaryLanguage'] === 'string') &&
    typeof value['stars'] === 'number' &&
    Number.isInteger(value['stars']) &&
    value['stars'] >= 0 &&
    isIsoInstant(value['lastActivityAt'])
  );
}

function isHttpsGitHubUrl(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  try {
    const url = new URL(value);

    return url.protocol === 'https:' && url.hostname === 'github.com';
  } catch {
    return false;
  }
}

function isIsoInstant(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
