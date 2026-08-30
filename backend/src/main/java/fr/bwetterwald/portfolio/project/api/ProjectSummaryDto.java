package fr.bwetterwald.portfolio.project.api;

import java.util.List;

public record ProjectSummaryDto(String slug, String title, String shortDescription, String logoMediaRef,
		String githubUrl, String demoUrl, boolean featured, String status, String presentationMode, int displayOrder,
		List<TechnologyDto> technologies) {
}
