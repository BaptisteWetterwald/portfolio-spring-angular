package fr.bwetterwald.portfolio.project.persistence;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import fr.bwetterwald.portfolio.project.domain.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<ProjectEntity, Long> {

	List<ProjectEntity> findByStatusInOrderByDisplayOrderAscPublishedAtDescIdAsc(Collection<ProjectStatus> statuses);

	List<ProjectEntity> findByStatusOrderByDisplayOrderAscPublishedAtDescIdAsc(ProjectStatus status);

	List<ProjectEntity> findByStatusAndFeaturedTrueOrderByDisplayOrderAscPublishedAtDescIdAsc(ProjectStatus status);

	Optional<ProjectEntity> findBySlugAndStatusIn(String slug, Collection<ProjectStatus> statuses);

	default List<ProjectEntity> findPublicProjects() {
		return findByStatusInOrderByDisplayOrderAscPublishedAtDescIdAsc(ProjectStatus.publicStatuses());
	}

	default List<ProjectEntity> findPublishedProjects() {
		return findByStatusOrderByDisplayOrderAscPublishedAtDescIdAsc(ProjectStatus.PUBLISHED);
	}

	default List<ProjectEntity> findArchivedProjects() {
		return findByStatusOrderByDisplayOrderAscPublishedAtDescIdAsc(ProjectStatus.ARCHIVED);
	}

	default List<ProjectEntity> findFeaturedPublishedProjects() {
		return findByStatusAndFeaturedTrueOrderByDisplayOrderAscPublishedAtDescIdAsc(ProjectStatus.PUBLISHED);
	}

	default Optional<ProjectEntity> findPublicProjectBySlug(String slug) {
		return findBySlugAndStatusIn(slug, ProjectStatus.publicStatuses());
	}

}
