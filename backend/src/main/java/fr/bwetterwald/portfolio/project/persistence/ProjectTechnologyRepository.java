package fr.bwetterwald.portfolio.project.persistence;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectTechnologyRepository extends JpaRepository<ProjectTechnologyEntity, ProjectTechnologyId> {

	@Query("""
			select projectTechnology
			from ProjectTechnologyEntity projectTechnology
			join fetch projectTechnology.technology technology
			where projectTechnology.project.id = :projectId
			order by projectTechnology.displayOrder asc, technology.name asc, technology.id asc
			""")
	List<ProjectTechnologyEntity> findByProjectIdInDisplayOrder(@Param("projectId") Long projectId);

	@Query("""
			select projectTechnology
			from ProjectTechnologyEntity projectTechnology
			where projectTechnology.technology.id = :technologyId
			""")
	List<ProjectTechnologyEntity> findByTechnologyId(@Param("technologyId") Long technologyId);

}
