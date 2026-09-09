package fr.bwetterwald.portfolio.github.api;

import java.time.Instant;
import java.util.List;

public record GitHubActivityDto(boolean available, String profileUrl, List<GitHubRepositoryActivityDto> repositories,
		GitHubContributionCalendarDto contributionCalendar, Instant lastRefreshedAt, boolean stale) {

	public GitHubActivityDto {
		repositories = List.copyOf(repositories);
	}

	public static GitHubActivityDto unavailable() {
		return new GitHubActivityDto(false, null, List.of(), null, null, false);
	}

}
