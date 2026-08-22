package fr.bwetterwald.portfolio.project.persistence;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import fr.bwetterwald.portfolio.project.domain.ProjectLocale;
import fr.bwetterwald.portfolio.project.domain.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectTranslationRepository extends JpaRepository<ProjectTranslationEntity, Long> {

	Optional<ProjectTranslationEntity> findByProjectIdAndLocale(Long projectId, ProjectLocale locale);

	@Query("""
			select translation
			from ProjectTranslationEntity translation
			where translation.project.status in :statuses
			and translation.locale = :locale
			order by translation.project.displayOrder asc, translation.project.publishedAt desc, translation.project.id asc
			""")
	List<ProjectTranslationEntity> findByProjectStatusesAndLocale(@Param("statuses") Collection<ProjectStatus> statuses,
			@Param("locale") ProjectLocale locale);

	default List<ProjectTranslationEntity> findPublicTranslations(ProjectLocale locale) {
		return findByProjectStatusesAndLocale(ProjectStatus.publicStatuses(), locale);
	}

}
