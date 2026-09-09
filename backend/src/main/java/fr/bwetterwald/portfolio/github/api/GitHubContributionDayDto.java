package fr.bwetterwald.portfolio.github.api;

import java.time.LocalDate;

public record GitHubContributionDayDto(LocalDate date, int contributionCount) {
}
