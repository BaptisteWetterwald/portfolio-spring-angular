package fr.bwetterwald.portfolio.project.application;

import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import fr.bwetterwald.portfolio.project.api.ProjectDetailDto;
import fr.bwetterwald.portfolio.project.api.ProjectSummaryDto;
import fr.bwetterwald.portfolio.project.api.TechnologyDto;
import fr.bwetterwald.portfolio.project.domain.ProjectLocale;
import fr.bwetterwald.portfolio.project.domain.ProjectStatus;
import fr.bwetterwald.portfolio.project.persistence.ProjectTechnologyEntity;
import fr.bwetterwald.portfolio.project.persistence.ProjectTechnologyRepository;
import fr.bwetterwald.portfolio.project.persistence.ProjectTranslationEntity;
import fr.bwetterwald.portfolio.project.persistence.ProjectTranslationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PublicProjectService {

	private final ProjectTranslationRepository projectTranslationRepository;

	private final ProjectTechnologyRepository projectTechnologyRepository;

	private final ProjectApiMapper projectApiMapper;

	public PublicProjectService(ProjectTranslationRepository projectTranslationRepository,
			ProjectTechnologyRepository projectTechnologyRepository, ProjectApiMapper projectApiMapper) {
		this.projectTranslationRepository = projectTranslationRepository;
		this.projectTechnologyRepository = projectTechnologyRepository;
		this.projectApiMapper = projectApiMapper;
	}

	@Transactional(readOnly = true)
	public List<ProjectSummaryDto> listProjects(String localeCode, String statusFilter) {
		ProjectLocale locale = parseLocale(localeCode);
		ProjectStatus status = parseStatusFilter(statusFilter);
		List<ProjectTranslationEntity> translations = (status == null)
				? this.projectTranslationRepository.findPublicTranslations(locale)
				: findTranslationsByStatus(locale, status);

		return toSummaries(translations);
	}

	@Transactional(readOnly = true)
	public List<ProjectSummaryDto> listFeaturedProjects(String localeCode) {
		ProjectLocale locale = parseLocale(localeCode);
		List<ProjectTranslationEntity> translations = this.projectTranslationRepository
			.findFeaturedPublishedTranslations(locale);

		return toSummaries(translations);
	}

	@Transactional(readOnly = true)
	public ProjectDetailDto getProject(String slug, String localeCode) {
		ProjectLocale locale = parseLocale(localeCode);
		ProjectTranslationEntity translation = this.projectTranslationRepository.findPublicTranslationBySlug(slug, locale)
			.orElseThrow(() -> new ProjectNotFoundException(slug));
		Long projectId = translation.getProject().getId();
		List<TechnologyDto> technologies = technologiesByProjectIds(List.of(projectId)).getOrDefault(projectId,
				List.of());
		List<ProjectLocale> availableLocales = this.projectTranslationRepository.findLocalesByProjectId(projectId);

		return this.projectApiMapper.toDetail(translation, technologies, availableLocales);
	}

	private List<ProjectSummaryDto> toSummaries(List<ProjectTranslationEntity> translations) {
		Map<Long, List<TechnologyDto>> technologiesByProjectId = technologiesByProjectIds(
				translations.stream().map((translation) -> translation.getProject().getId()).toList());

		return translations.stream()
			.map((translation) -> this.projectApiMapper.toSummary(translation,
					technologiesByProjectId.getOrDefault(translation.getProject().getId(), List.of())))
			.toList();
	}

	private Map<Long, List<TechnologyDto>> technologiesByProjectIds(Collection<Long> projectIds) {
		if (projectIds.isEmpty()) {
			return Map.of();
		}

		Map<Long, List<TechnologyDto>> technologiesByProjectId = new LinkedHashMap<>();
		for (ProjectTechnologyEntity projectTechnology : this.projectTechnologyRepository
			.findByProjectIdInDisplayOrder(projectIds)) {
			Long projectId = projectTechnology.getId().getProjectId();

			technologiesByProjectId.computeIfAbsent(projectId, (ignored) -> new java.util.ArrayList<>())
				.add(this.projectApiMapper.toTechnology(projectTechnology));
		}

		technologiesByProjectId.replaceAll((projectId, technologies) -> List.copyOf(technologies));

		return Collections.unmodifiableMap(technologiesByProjectId);
	}

	private List<ProjectTranslationEntity> findTranslationsByStatus(ProjectLocale locale, ProjectStatus status) {
		if (status == ProjectStatus.PUBLISHED) {
			return this.projectTranslationRepository.findPublishedTranslations(locale);
		}
		if (status == ProjectStatus.ARCHIVED) {
			return this.projectTranslationRepository.findArchivedTranslations(locale);
		}

		throw new UnsupportedPublicProjectStatusException(status.name());
	}

	private static ProjectLocale parseLocale(String localeCode) {
		try {
			return ProjectLocale.fromCode(localeCode);
		}
		catch (IllegalArgumentException exception) {
			throw new UnsupportedProjectLocaleException(localeCode);
		}
	}

	private static ProjectStatus parseStatusFilter(String statusFilter) {
		if (statusFilter == null) {
			return null;
		}
		if (statusFilter.isBlank()) {
			throw new UnsupportedPublicProjectStatusException(statusFilter);
		}
		try {
			ProjectStatus status = ProjectStatus.valueOf(statusFilter.trim().toUpperCase(Locale.ROOT));

			if (!status.isPubliclyVisible()) {
				throw new UnsupportedPublicProjectStatusException(statusFilter);
			}

			return status;
		}
		catch (IllegalArgumentException exception) {
			throw new UnsupportedPublicProjectStatusException(statusFilter);
		}
	}

}
