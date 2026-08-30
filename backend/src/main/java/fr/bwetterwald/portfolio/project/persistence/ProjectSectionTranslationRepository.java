package fr.bwetterwald.portfolio.project.persistence;

import java.util.List;

import fr.bwetterwald.portfolio.project.domain.ProjectLocale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectSectionTranslationRepository extends JpaRepository<ProjectSectionTranslationEntity, Long> {

	@Query("""
			select translation
			from ProjectSectionTranslationEntity translation
			join fetch translation.section section
			where section.project.id = :projectId
			and translation.locale = :locale
			order by section.displayOrder asc, section.id asc
			""")
	List<ProjectSectionTranslationEntity> findByProjectIdAndLocaleInDisplayOrder(@Param("projectId") Long projectId,
			@Param("locale") ProjectLocale locale);

}
