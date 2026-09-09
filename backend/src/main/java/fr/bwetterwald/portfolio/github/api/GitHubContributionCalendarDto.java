package fr.bwetterwald.portfolio.github.api;

import java.time.LocalDate;
import java.util.List;

public record GitHubContributionCalendarDto(int totalContributions, LocalDate startsOn, LocalDate endsOn,
		List<GitHubContributionDayDto> days) {

	public GitHubContributionCalendarDto {
		days = List.copyOf(days);
	}

}
