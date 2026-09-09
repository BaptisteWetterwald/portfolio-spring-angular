package fr.bwetterwald.portfolio.github.client;

public record GitHubRepositoryData(String name, String description, String language, Integer stars, String pushedAt,
		Boolean fork, Boolean archived, Boolean disabled) {
}
