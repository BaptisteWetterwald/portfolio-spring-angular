package fr.bwetterwald.portfolio.project.persistence;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import fr.bwetterwald.portfolio.project.domain.ProjectLocale;
import fr.bwetterwald.portfolio.project.domain.ProjectPresentationMode;
import fr.bwetterwald.portfolio.project.domain.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectTranslationRepository extends JpaRepository<ProjectTranslationEntity, Long> {

	Optional<ProjectTranslationEntity> findByProjectIdAndLocale(Long projectId, ProjectLocale locale);

	@Query("""
			select translation
			from ProjectTranslationEntity translation
			join fetch translation.project project
			where project.status in :statuses
			and translation.locale = :locale
			order by project.displayOrder asc, project.publishedAt desc, project.id asc
			""")
	List<ProjectTranslationEntity> findByProjectStatusesAndLocale(@Param("statuses") Collection<ProjectStatus> statuses,
			@Param("locale") ProjectLocale locale);

	@Query("""
			select translation
			from ProjectTranslationEntity translation
			join fetch translation.project project
			where project.status = :status
			and translation.locale = :locale
			order by project.displayOrder asc, project.publishedAt desc, project.id asc
			""")
	List<ProjectTranslationEntity> findByProjectStatusAndLocale(@Param("status") ProjectStatus status,
			@Param("locale") ProjectLocale locale);

	@Query("""
			select translation
			from ProjectTranslationEntity translation
			join fetch translation.project project
			where project.status = :status
			and project.featured = true
			and translation.locale = :locale
			order by project.displayOrder asc, project.publishedAt desc, project.id asc
			""")
	List<ProjectTranslationEntity> findFeaturedByProjectStatusAndLocale(@Param("status") ProjectStatus status,
			@Param("locale") ProjectLocale locale);

	@Query("""
			select translation
			from ProjectTranslationEntity translation
			join fetch translation.project project
			where project.slug = :slug
			and project.status in :statuses
			and project.presentationMode = :presentationMode
			and translation.locale = :locale
			""")
	Optional<ProjectTranslationEntity> findByProjectSlugAndStatusesAndPresentationModeAndLocale(@Param("slug") String slug,
			@Param("statuses") Collection<ProjectStatus> statuses,
			@Param("presentationMode") ProjectPresentationMode presentationMode, @Param("locale") ProjectLocale locale);

	@Query("""
			select translation.locale
			from ProjectTranslationEntity translation
			where translation.project.id = :projectId
			order by translation.locale asc
			""")
	List<ProjectLocale> findLocalesByProjectId(@Param("projectId") Long projectId);

	default List<ProjectTranslationEntity> findPublicTranslations(ProjectLocale locale) {
		return findByProjectStatusesAndLocale(ProjectStatus.publicStatuses(), locale);
	}

	default List<ProjectTranslationEntity> findPublishedTranslations(ProjectLocale locale) {
		return findByProjectStatusAndLocale(ProjectStatus.PUBLISHED, locale);
	}

	default List<ProjectTranslationEntity> findArchivedTranslations(ProjectLocale locale) {
		return findByProjectStatusAndLocale(ProjectStatus.ARCHIVED, locale);
	}

	default List<ProjectTranslationEntity> findFeaturedPublishedTranslations(ProjectLocale locale) {
		return findFeaturedByProjectStatusAndLocale(ProjectStatus.PUBLISHED, locale);
	}

	default Optional<ProjectTranslationEntity> findPublicDetailTranslationBySlug(String slug, ProjectLocale locale) {
		return findByProjectSlugAndStatusesAndPresentationModeAndLocale(slug, ProjectStatus.publicStatuses(),
				ProjectPresentationMode.DETAIL, locale);
	}

}
