package fr.bwetterwald.portfolio.project.application;

import java.util.List;

import fr.bwetterwald.portfolio.project.api.ProjectDetailDto;
import fr.bwetterwald.portfolio.project.api.ProjectSectionDto;
import fr.bwetterwald.portfolio.project.api.ProjectSummaryDto;
import fr.bwetterwald.portfolio.project.api.TechnologyDto;
import fr.bwetterwald.portfolio.project.domain.ProjectLocale;
import fr.bwetterwald.portfolio.project.persistence.ProjectEntity;
import fr.bwetterwald.portfolio.project.persistence.ProjectSectionTranslationEntity;
import fr.bwetterwald.portfolio.project.persistence.ProjectTechnologyEntity;
import fr.bwetterwald.portfolio.project.persistence.ProjectTranslationEntity;
import fr.bwetterwald.portfolio.technology.persistence.TechnologyEntity;
import org.springframework.stereotype.Component;

@Component
class ProjectApiMapper {

	ProjectSummaryDto toSummary(ProjectTranslationEntity translation, List<TechnologyDto> technologies) {
		ProjectEntity project = translation.getProject();

		return new ProjectSummaryDto(project.getSlug(), translation.getTitle(), translation.getShortDescription(),
				project.getLogoMediaRef(), project.getGithubUrl(), project.getDemoUrl(), project.isFeatured(),
				project.getStatus().name(), project.getPresentationMode().name(), project.getDisplayOrder(),
				List.copyOf(technologies));
	}

	ProjectDetailDto toDetail(ProjectTranslationEntity translation, List<TechnologyDto> technologies,
			List<ProjectSectionDto> sections, List<ProjectLocale> availableLocales) {
		ProjectEntity project = translation.getProject();

		return new ProjectDetailDto(project.getSlug(), translation.getTitle(), translation.getShortDescription(),
				translation.getDetailedDescription(), project.getLogoMediaRef(), project.getGithubUrl(),
				project.getDemoUrl(), project.isFeatured(), project.getStatus().name(),
				project.getPresentationMode().name(), project.getDisplayOrder(), List.copyOf(technologies),
				List.copyOf(sections), availableLocales.stream().map(ProjectLocale::getCode).toList());
	}

	TechnologyDto toTechnology(ProjectTechnologyEntity projectTechnology) {
		TechnologyEntity technology = projectTechnology.getTechnology();

		return new TechnologyDto(technology.getSlug(), technology.getName(), technology.getIconRef(),
				technology.getCategory());
	}

	ProjectSectionDto toSection(ProjectSectionTranslationEntity sectionTranslation) {
		return new ProjectSectionDto(sectionTranslation.getTitle(), sectionTranslation.getContent());
	}

}
