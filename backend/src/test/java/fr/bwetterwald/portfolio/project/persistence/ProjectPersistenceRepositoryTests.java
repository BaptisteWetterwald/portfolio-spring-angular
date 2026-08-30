package fr.bwetterwald.portfolio.project.persistence;

import java.time.Instant;
import java.util.List;

import fr.bwetterwald.portfolio.project.domain.ProjectLocale;
import fr.bwetterwald.portfolio.project.domain.ProjectPresentationMode;
import fr.bwetterwald.portfolio.project.domain.ProjectStatus;
import fr.bwetterwald.portfolio.support.AbstractPostgresSpringTest;
import fr.bwetterwald.portfolio.support.PostgresTestDatabase;
import fr.bwetterwald.portfolio.technology.persistence.TechnologyEntity;
import fr.bwetterwald.portfolio.technology.persistence.TechnologyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
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
	private ProjectSectionTranslationRepository projectSectionTranslationRepository;

	@Autowired
	private TechnologyRepository technologyRepository;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@BeforeEach
	void removeProductionSeedDataFromFixtureTests() {
		deleteAllProjectData();
	}

	@Test
	void persistsProjectWithTranslationsAndOrderedTechnologies() {
		TechnologyEntity springBoot = technologyRepository.save(technology("Spring Boot", "spring-boot"));
		TechnologyEntity angular = technologyRepository.save(technology("Angular", "angular"));

		ProjectEntity project = project("portfolio-demo", ProjectStatus.PUBLISHED, 20);
		project.setFeatured(true);
		project.setLogoMediaRef("/assets/projects/portfolio-demo-logo.svg");
		project.setGithubUrl("https://example.test/portfolio-demo.git");
		project.setDemoUrl("https://demo.example.test/portfolio-demo");
		project.setPublishedAt(Instant.parse("2026-01-15T10:00:00Z"));
		project.addTranslation(ProjectLocale.EN, "Portfolio demo", "English short description", null);
		project.addTranslation(ProjectLocale.FR, "Demo portfolio", "Description courte francaise",
				"Description detaillee francaise");
		ProjectSectionEntity architecture = project.addSection(20);
		architecture.addTranslation(ProjectLocale.EN, "Architecture", "English architecture section");
		architecture.addTranslation(ProjectLocale.FR, "Architecture", "Section d'architecture francaise");
		ProjectSectionEntity context = project.addSection(10);
		context.addTranslation(ProjectLocale.EN, "Context", "English context section");
		context.addTranslation(ProjectLocale.FR, "Contexte", "Section de contexte francaise");
		project.addTechnology(springBoot, 20);
		project.addTechnology(angular, 10);

		ProjectEntity persistedProject = projectRepository.saveAndFlush(project);

		assertThat(persistedProject.getId()).isNotNull();
		assertThat(persistedProject.getCreatedAt()).isNotNull();
		assertThat(persistedProject.getUpdatedAt()).isNotNull();
		assertThat(persistedProject.getLogoMediaRef()).isEqualTo("/assets/projects/portfolio-demo-logo.svg");
		assertThat(persistedProject.getGithubUrl()).isEqualTo("https://example.test/portfolio-demo.git");
		assertThat(persistedProject.getDemoUrl()).isEqualTo("https://demo.example.test/portfolio-demo");
		assertThat(persistedProject.getPresentationMode()).isEqualTo(ProjectPresentationMode.DETAIL);

		ProjectTranslationEntity englishTranslation = projectTranslationRepository
			.findByProjectIdAndLocale(persistedProject.getId(), ProjectLocale.EN)
			.orElseThrow();
		assertThat(englishTranslation.getDetailedDescription()).isNull();

		List<ProjectTechnologyEntity> orderedTechnologies = projectTechnologyRepository
			.findByProjectIdInDisplayOrder(persistedProject.getId());
		assertThat(orderedTechnologies).extracting((projectTechnology) -> projectTechnology.getTechnology().getSlug())
			.containsExactly("angular", "spring-boot");

		List<ProjectSectionTranslationEntity> orderedSections = projectSectionTranslationRepository
			.findByProjectIdAndLocaleInDisplayOrder(persistedProject.getId(), ProjectLocale.EN);
		assertThat(orderedSections).extracting(ProjectSectionTranslationEntity::getTitle)
			.containsExactly("Context", "Architecture");
		assertThat(orderedSections).extracting(ProjectSectionTranslationEntity::getContent)
			.containsExactly("English context section", "English architecture section");
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
	void publicTranslationListsIncludeCardOnlyAndDetailProjectsByStatus() {
		ProjectEntity publishedCardOnly = saveTranslatedProject("published-card-only", ProjectStatus.PUBLISHED,
				ProjectPresentationMode.CARD_ONLY, 10);
		ProjectEntity archivedCardOnly = saveTranslatedProject("archived-card-only", ProjectStatus.ARCHIVED,
				ProjectPresentationMode.CARD_ONLY, 20);
		ProjectEntity publishedDetail = saveTranslatedProject("published-detail", ProjectStatus.PUBLISHED,
				ProjectPresentationMode.DETAIL, 30);
		saveTranslatedProject("draft-detail", ProjectStatus.DRAFT, ProjectPresentationMode.DETAIL, 40);

		assertThat(projectTranslationRepository.findPublicTranslations(ProjectLocale.EN))
			.extracting((translation) -> translation.getProject().getSlug())
			.containsExactly(publishedCardOnly.getSlug(), archivedCardOnly.getSlug(), publishedDetail.getSlug());
	}

	@Test
	void publicDetailTranslationLookupRequiresDetailPresentationMode() {
		ProjectEntity publishedCardOnly = saveTranslatedProject("published-card-only", ProjectStatus.PUBLISHED,
				ProjectPresentationMode.CARD_ONLY, 10);
		ProjectEntity publishedDetail = saveTranslatedProject("published-detail", ProjectStatus.PUBLISHED,
				ProjectPresentationMode.DETAIL, 20);
		ProjectEntity archivedDetail = saveTranslatedProject("archived-detail", ProjectStatus.ARCHIVED,
				ProjectPresentationMode.DETAIL, 30);
		ProjectEntity draftDetail = saveTranslatedProject("draft-detail", ProjectStatus.DRAFT,
				ProjectPresentationMode.DETAIL, 40);

		assertThat(projectTranslationRepository.findPublicDetailTranslationBySlug(publishedCardOnly.getSlug(),
				ProjectLocale.EN)).isEmpty();
		assertThat(projectTranslationRepository.findPublicDetailTranslationBySlug(publishedDetail.getSlug(),
				ProjectLocale.EN)).isPresent();
		assertThat(projectTranslationRepository.findPublicDetailTranslationBySlug(archivedDetail.getSlug(),
				ProjectLocale.EN)).isPresent();
		assertThat(projectTranslationRepository.findPublicDetailTranslationBySlug(draftDetail.getSlug(),
				ProjectLocale.EN)).isEmpty();
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
	void duplicateProjectSectionDisplayOrderIsRejected() {
		ProjectEntity project = project("duplicate-section-order", ProjectStatus.PUBLISHED, 10);
		project.addSection(10).addTranslation(ProjectLocale.EN, "Context", "Context content");
		project.addSection(10).addTranslation(ProjectLocale.EN, "Architecture", "Architecture content");

		assertThatThrownBy(() -> projectRepository.saveAndFlush(project)).isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void duplicateProjectSectionLocaleTranslationIsRejected() {
		ProjectEntity project = project("duplicate-section-locale", ProjectStatus.PUBLISHED, 10);
		ProjectSectionEntity section = project.addSection(10);
		section.addTranslation(ProjectLocale.EN, "Context", "Context content");
		section.addTranslation(ProjectLocale.EN, "Context duplicate", "Duplicate content");

		assertThatThrownBy(() -> projectRepository.saveAndFlush(project)).isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void blankProjectSectionContentIsRejectedByDatabaseConstraint() {
		ProjectEntity project = project("blank-section-content", ProjectStatus.PUBLISHED, 10);
		project.addSection(10).addTranslation(ProjectLocale.EN, "Context", "   ");

		assertThatThrownBy(() -> projectRepository.saveAndFlush(project)).isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void unsupportedProjectStatusIsRejectedByDatabaseConstraint() {
		assertThatThrownBy(() -> this.jdbcTemplate.update("""
				insert into %s.projects (slug, featured, status, presentation_mode, display_order, created_at, updated_at)
				values ('unsupported-status', false, 'DELETED', 'DETAIL', 0, now(), now())
				""".formatted(isolatedPostgresSchema()))).isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void unsupportedProjectPresentationModeIsRejectedByDatabaseConstraint() {
		assertThatThrownBy(() -> this.jdbcTemplate.update("""
				insert into %s.projects (slug, featured, status, presentation_mode, display_order, created_at, updated_at)
				values ('unsupported-presentation-mode', false, 'PUBLISHED', 'SUMMARY', 0, now(), now())
				""".formatted(isolatedPostgresSchema()))).isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void invalidProjectSlugIsRejectedByDatabaseConstraint() {
		ProjectEntity project = project("Invalid Slug", ProjectStatus.PUBLISHED, 10);

		assertThatThrownBy(() -> projectRepository.saveAndFlush(project)).isInstanceOf(DataIntegrityViolationException.class);
	}

	@ParameterizedTest
	@ValueSource(strings = { "media/projects/logo.svg", "//cdn.example.test/logo.svg",
			"http://cdn.example.test/logo.svg", "javascript:alert(1)", "data:image/svg+xml;base64,AAAA",
			" /assets/projects/logo.svg", "/assets/projects/logo with spaces.svg" })
	void invalidProjectMediaRefsAreRejectedByDatabaseConstraint(String logoMediaRef) {
		ProjectEntity project = project("invalid-media-ref-" + Integer.toUnsignedString(logoMediaRef.hashCode()),
				ProjectStatus.PUBLISHED, 10);
		project.setLogoMediaRef(logoMediaRef);

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
		return saveTranslatedProject(slug, status, ProjectPresentationMode.DETAIL, displayOrder);
	}

	private ProjectEntity saveTranslatedProject(String slug, ProjectStatus status, ProjectPresentationMode presentationMode,
			int displayOrder) {
		ProjectEntity project = project(slug, status, presentationMode, displayOrder);
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
		return project(slug, status, ProjectPresentationMode.DETAIL, displayOrder);
	}

	private static ProjectEntity project(String slug, ProjectStatus status, ProjectPresentationMode presentationMode,
			int displayOrder) {
		ProjectEntity project = new ProjectEntity(slug, status, presentationMode, displayOrder);
		project.setPublishedAt(Instant.parse("2026-01-15T10:00:00Z"));
		return project;
	}

	private static TechnologyEntity technology(String name, String slug) {
		TechnologyEntity technology = new TechnologyEntity(name, slug);
		technology.setCategory("fixture");
		technology.setIconRef("icons/" + slug + ".svg");
		return technology;
	}

	private void deleteAllProjectData() {
		String schema = isolatedPostgresSchema();

		this.jdbcTemplate.update("delete from %s.project_technologies".formatted(schema));
		this.jdbcTemplate.update("delete from %s.project_section_translations".formatted(schema));
		this.jdbcTemplate.update("delete from %s.project_sections".formatted(schema));
		this.jdbcTemplate.update("delete from %s.project_translations".formatted(schema));
		this.jdbcTemplate.update("delete from %s.projects".formatted(schema));
		this.jdbcTemplate.update("delete from %s.technologies".formatted(schema));
	}

}
