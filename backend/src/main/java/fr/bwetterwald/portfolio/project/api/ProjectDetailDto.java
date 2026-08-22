package fr.bwetterwald.portfolio.project.api;

import java.util.List;

public record ProjectDetailDto(String slug, String title, String shortDescription, String detailedDescription,
		String logoMediaRef, String githubUrl, String demoUrl, boolean featured, String status, int displayOrder,
		List<TechnologyDto> technologies, List<String> availableLocales) {
}
