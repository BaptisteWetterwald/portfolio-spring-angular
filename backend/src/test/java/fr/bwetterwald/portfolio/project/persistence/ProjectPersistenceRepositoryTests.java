package fr.bwetterwald.portfolio.project.persistence;

import java.time.Instant;
import java.util.List;

import fr.bwetterwald.portfolio.project.domain.ProjectLocale;
import fr.bwetterwald.portfolio.project.domain.ProjectStatus;
import fr.bwetterwald.portfolio.support.AbstractPostgresSpringTest;
import fr.bwetterwald.portfolio.support.PostgresTestDatabase;
import fr.bwetterwald.portfolio.technology.persistence.TechnologyEntity;
import fr.bwetterwald.portfolio.technology.persistence.TechnologyRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@Transactional
class ProjectPersistenceRepositoryTests extends AbstractPostgresSpringTest {

	@Autowired
	private ProjectRepository projectRepository;

	@Autowired
	private ProjectTranslationRepository projectTranslationRepository;

	@Autowired
	private ProjectTechnologyRepository projectTechnologyRepository;

	@Autowired
	private TechnologyRepository technologyRepository;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Test
	void persistsProjectWithTranslationsAndOrderedTechnologies() {
		TechnologyEntity springBoot = technologyRepository.save(technology("Spring Boot", "spring-boot"));
		TechnologyEntity angular = technologyRepository.save(technology("Angular", "angular"));

		ProjectEntity project = project("portfolio-demo", ProjectStatus.PUBLISHED, 20);
		project.setFeatured(true);
		project.setLogoMediaRef("media/projects/portfolio-demo-logo.svg");
		project.setGithubUrl("https://example.test/portfolio-demo.git");
		project.setDemoUrl("https://demo.example.test/portfolio-demo");
		project.setPublishedAt(Instant.parse("2026-01-15T10:00:00Z"));
		project.addTranslation(ProjectLocale.EN, "Portfolio demo", "English short description", null);
		project.addTranslation(ProjectLocale.FR, "Demo portfolio", "Description courte francaise",
				"Description detaillee francaise");
		project.addTechnology(springBoot, 20);
		project.addTechnology(angular, 10);

		ProjectEntity persistedProject = projectRepository.saveAndFlush(project);

		assertThat(persistedProject.getId()).isNotNull();
		assertThat(persistedProject.getCreatedAt()).isNotNull();
		assertThat(persistedProject.getUpdatedAt()).isNotNull();
		assertThat(persistedProject.getLogoMediaRef()).isEqualTo("media/projects/portfolio-demo-logo.svg");
		assertThat(persistedProject.getGithubUrl()).isEqualTo("https://example.test/portfolio-demo.git");
		assertThat(persistedProject.getDemoUrl()).isEqualTo("https://demo.example.test/portfolio-demo");

		ProjectTranslationEntity englishTranslation = projectTranslationRepository
			.findByProjectIdAndLocale(persistedProject.getId(), ProjectLocale.EN)
			.orElseThrow();
		assertThat(englishTranslation.getDetailedDescription()).isNull();

		List<ProjectTechnologyEntity> orderedTechnologies = projectTechnologyRepository
			.findByProjectIdInDisplayOrder(persistedProject.getId());
		assertThat(orderedTechnologies).extracting((projectTechnology) -> projectTechnology.getTechnology().getSlug())
			.containsExactly("angular", "spring-boot");
	}

	@Test
	void springPersistenceTestUsesGeneratedNonPublicSchema() {
		String schema = isolatedPostgresSchema();

		assertThat(schema).startsWith(PostgresTestDatabase.SCHEMA_PREFIX).isNotEqualTo("public");
		assertThat(PostgresTestDatabase.isGeneratedSchemaName(schema)).isTrue();
		assertThat(this.jdbcTemplate.queryForObject("""
				select count(*)
				from %s.flyway_schema_history
				where version = '1' and success is true
				""".formatted(schema), Integer.class)).isEqualTo(1);
	}

	@Test
	void publicProjectQueriesExcludeDraftProjects() {
		ProjectEntity draft = saveProject("draft-project", ProjectStatus.DRAFT, false, 10);
		ProjectEntity published = saveProject("published-project", ProjectStatus.PUBLISHED, false, 20);
		ProjectEntity archived = saveProject("archived-project", ProjectStatus.ARCHIVED, false, 30);

		assertThat(projectRepository.findPublicProjects()).extracting(ProjectEntity::getSlug)
			.containsExactly(published.getSlug(), archived.getSlug());
		assertThat(projectRepository.findPublishedProjects()).extracting(ProjectEntity::getSlug)
			.containsExactly(published.getSlug());
		assertThat(projectRepository.findArchivedProjects()).extracting(ProjectEntity::getSlug)
			.containsExactly(archived.getSlug());
		assertThat(projectRepository.findPublicProjectBySlug(draft.getSlug())).isEmpty();
		assertThat(projectRepository.findPublicProjectBySlug(published.getSlug())).contains(published);
	}

	@Test
	void featuredQueryReturnsFeaturedPublishedProjectsOnly() {
		ProjectEntity featuredPublished = saveProject("featured-published", ProjectStatus.PUBLISHED, true, 10);
		saveProject("regular-published", ProjectStatus.PUBLISHED, false, 20);
		saveProject("featured-archived", ProjectStatus.ARCHIVED, true, 30);
		saveProject("featured-draft", ProjectStatus.DRAFT, true, 40);

		assertThat(projectRepository.findFeaturedPublishedProjects()).extracting(ProjectEntity::getSlug)
			.containsExactly(featuredPublished.getSlug());
	}

	@Test
	void translationQueriesSupportLocaleFilteringForPublicProjects() {
		saveTranslatedProject("draft-translated", ProjectStatus.DRAFT, 10);
		ProjectEntity published = saveTranslatedProject("published-translated", ProjectStatus.PUBLISHED, 20);
		ProjectEntity archived = saveTranslatedProject("archived-translated", ProjectStatus.ARCHIVED, 30);

		assertThat(projectTranslationRepository.findPublicTranslations(ProjectLocale.FR))
			.extracting((translation) -> translation.getProject().getSlug())
			.containsExactly(published.getSlug(), archived.getSlug());
	}

	@Test
	void duplicateProjectSlugIsRejected() {
		saveProject("duplicate-slug", ProjectStatus.PUBLISHED, false, 10);

		assertThatThrownBy(() -> saveProject("duplicate-slug", ProjectStatus.ARCHIVED, false, 20))
			.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void duplicateProjectLocaleTranslationIsRejected() {
		ProjectEntity project = project("duplicate-locale", ProjectStatus.PUBLISHED, 10);
		project.addTranslation(ProjectLocale.EN, "First English title", "First English short description", null);
		project.addTranslation(ProjectLocale.EN, "Second English title", "Second English short description", null);

		assertThatThrownBy(() -> projectRepository.saveAndFlush(project)).isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void unsupportedProjectStatusIsRejectedByDatabaseConstraint() {
		assertThatThrownBy(() -> this.jdbcTemplate.update("""
				insert into %s.projects (slug, featured, status, display_order, created_at, updated_at)
				values ('unsupported-status', false, 'DELETED', 0, now(), now())
				""".formatted(isolatedPostgresSchema()))).isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void invalidProjectSlugIsRejectedByDatabaseConstraint() {
		ProjectEntity project = project("Invalid Slug", ProjectStatus.PUBLISHED, 10);

		assertThatThrownBy(() -> projectRepository.saveAndFlush(project)).isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void technologyDeletionIsRestrictedWhenUsedByProject() {
		TechnologyEntity technology = technologyRepository.saveAndFlush(technology("PostgreSQL", "postgresql"));
		ProjectEntity project = project("uses-postgresql", ProjectStatus.PUBLISHED, 10);
		project.addTechnology(technology, 10);
		projectRepository.saveAndFlush(project);

		assertThatThrownBy(() -> this.jdbcTemplate.update(
				"delete from %s.technologies where id = ?".formatted(isolatedPostgresSchema()), technology.getId()))
			.isInstanceOf(DataIntegrityViolationException.class);
	}

	private ProjectEntity saveTranslatedProject(String slug, ProjectStatus status, int displayOrder) {
		ProjectEntity project = project(slug, status, displayOrder);
		project.addTranslation(ProjectLocale.EN, slug + " EN", "English short description", null);
		project.addTranslation(ProjectLocale.FR, slug + " FR", "Description courte francaise", null);
		return projectRepository.saveAndFlush(project);
	}

	private ProjectEntity saveProject(String slug, ProjectStatus status, boolean featured, int displayOrder) {
		ProjectEntity project = project(slug, status, displayOrder);
		project.setFeatured(featured);
		return projectRepository.saveAndFlush(project);
	}

	private static ProjectEntity project(String slug, ProjectStatus status, int displayOrder) {
		ProjectEntity project = new ProjectEntity(slug, status, displayOrder);
		project.setPublishedAt(Instant.parse("2026-01-15T10:00:00Z"));
		return project;
	}

	private static TechnologyEntity technology(String name, String slug) {
		TechnologyEntity technology = new TechnologyEntity(name, slug);
		technology.setCategory("fixture");
		technology.setIconRef("icons/" + slug + ".svg");
		return technology;
	}

}
