package fr.bwetterwald.portfolio.github.api;

import java.time.Instant;

public record GitHubRepositoryActivityDto(String name, String url, String description, String primaryLanguage,
		int stars, Instant lastActivityAt) {
}
