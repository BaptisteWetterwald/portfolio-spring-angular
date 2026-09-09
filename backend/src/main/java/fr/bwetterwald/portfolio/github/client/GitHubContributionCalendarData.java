package fr.bwetterwald.portfolio.github.client;

import java.util.List;

public record GitHubContributionCalendarData(int totalContributions, List<GitHubContributionDayData> days) {

	public GitHubContributionCalendarData {
		days = List.copyOf(days);
	}

}
