package fr.bwetterwald.portfolio.project.api;

import java.util.List;

public record ProjectDetailDto(String slug, String title, String shortDescription, String detailedDescription,
		String logoMediaRef, String githubUrl, String demoUrl, boolean featured, String status,
		String presentationMode, int displayOrder, List<TechnologyDto> technologies, List<ProjectSectionDto> sections,
		List<String> availableLocales) {
}
