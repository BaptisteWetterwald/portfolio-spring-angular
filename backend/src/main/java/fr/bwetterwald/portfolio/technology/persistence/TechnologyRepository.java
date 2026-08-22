package fr.bwetterwald.portfolio.technology.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TechnologyRepository extends JpaRepository<TechnologyEntity, Long> {

	Optional<TechnologyEntity> findBySlug(String slug);

	List<TechnologyEntity> findAllByOrderByNameAsc();

}
