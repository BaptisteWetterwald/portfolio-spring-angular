package fr.bwetterwald.portfolio.github.client;

import java.time.LocalDate;

public record GitHubContributionDayData(LocalDate date, int contributionCount) {
}
