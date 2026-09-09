export interface GitHubRepositoryActivityDto {
  readonly name: string;
  readonly url: string;
  readonly description: string | null;
  readonly primaryLanguage: string | null;
  readonly stars: number;
  readonly lastActivityAt: string;
}

export interface GitHubContributionDayDto {
  readonly date: string;
  readonly contributionCount: number;
}

export interface GitHubContributionCalendarDto {
  readonly totalContributions: number;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly days: readonly GitHubContributionDayDto[];
}

export interface GitHubActivityDto {
  readonly available: boolean;
  readonly profileUrl: string | null;
  readonly repositories: readonly GitHubRepositoryActivityDto[];
  readonly contributionCalendar: GitHubContributionCalendarDto | null;
  readonly lastRefreshedAt: string | null;
  readonly stale: boolean;
}

export interface GitHubActivityAvailableState {
  readonly kind: 'available';
  readonly activity: GitHubActivityDto & {
    readonly profileUrl: string;
    readonly repositories: readonly GitHubRepositoryActivityDto[];
  };
}

export interface GitHubActivityUnavailableState {
  readonly kind: 'unavailable';
}

export type GitHubActivityState = GitHubActivityAvailableState | GitHubActivityUnavailableState;
