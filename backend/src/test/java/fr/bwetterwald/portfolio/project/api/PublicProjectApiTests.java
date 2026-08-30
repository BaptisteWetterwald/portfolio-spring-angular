package fr.bwetterwald.portfolio.project.api;

import java.time.Instant;

import fr.bwetterwald.portfolio.project.domain.ProjectLocale;
import fr.bwetterwald.portfolio.project.domain.ProjectPresentationMode;
import fr.bwetterwald.portfolio.project.domain.ProjectStatus;
import fr.bwetterwald.portfolio.project.persistence.ProjectEntity;
import fr.bwetterwald.portfolio.project.persistence.ProjectRepository;
import fr.bwetterwald.portfolio.project.persistence.ProjectSectionEntity;
import fr.bwetterwald.portfolio.support.AbstractPostgresSpringTest;
import fr.bwetterwald.portfolio.technology.persistence.TechnologyEntity;
import fr.bwetterwald.portfolio.technology.persistence.TechnologyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PublicProjectApiTests extends AbstractPostgresSpringTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ProjectRepository projectRepository;

	@Autowired
	private TechnologyRepository technologyRepository;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@BeforeEach
	void removeProductionSeedDataFromFixtureTests() {
		deleteAllProjectData();
	}

	@Test
	void publicListReturnsRequestedLocaleAndExcludesDraftProjects() throws Exception {
		saveTranslatedProject("draft-fixture", ProjectStatus.DRAFT, ProjectPresentationMode.DETAIL, false, 10);
		saveTranslatedProject("published-fixture", ProjectStatus.PUBLISHED, ProjectPresentationMode.CARD_ONLY, false,
				20);
		saveSectionedProject("archived-fixture", ProjectStatus.ARCHIVED, ProjectPresentationMode.CARD_ONLY, false, 30);

		this.mockMvc.perform(get("/api/v1/projects").queryParam("locale", "fr"))
			.andExpect(status().isOk())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
			.andExpect(jsonPath("$[0].slug").value("published-fixture"))
			.andExpect(jsonPath("$[0].title").value("published-fixture FR"))
			.andExpect(jsonPath("$[0].status").value("PUBLISHED"))
			.andExpect(jsonPath("$[0].presentationMode").value("CARD_ONLY"))
			.andExpect(jsonPath("$[1].slug").value("archived-fixture"))
			.andExpect(jsonPath("$[1].title").value("archived-fixture FR"))
			.andExpect(jsonPath("$[1].status").value("ARCHIVED"))
			.andExpect(jsonPath("$[1].presentationMode").value("CARD_ONLY"))
			.andExpect(jsonPath("$[2]").doesNotExist())
			.andExpect(jsonPath("$[0].sections").doesNotExist())
			.andExpect(jsonPath("$[1].sections").doesNotExist())
			.andExpect(content().string(not(containsString("\"sections\""))))
			.andExpect(content().string(not(containsString("French section body"))));
	}

	@Test
	void publicListIncludesDetailAndCardOnlyProjectsIndependentlyOfPublicationStatus() throws Exception {
		saveTranslatedProject("published-card-only", ProjectStatus.PUBLISHED, ProjectPresentationMode.CARD_ONLY, false,
				10);
		saveTranslatedProject("archived-card-only", ProjectStatus.ARCHIVED, ProjectPresentationMode.CARD_ONLY, false,
				20);
		saveTranslatedProject("published-detail", ProjectStatus.PUBLISHED, ProjectPresentationMode.DETAIL, false, 30);
		saveTranslatedProject("draft-card-only", ProjectStatus.DRAFT, ProjectPresentationMode.CARD_ONLY, false, 40);

		this.mockMvc.perform(get("/api/v1/projects").queryParam("locale", "en"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].slug").value("published-card-only"))
			.andExpect(jsonPath("$[0].presentationMode").value("CARD_ONLY"))
			.andExpect(jsonPath("$[1].slug").value("archived-card-only"))
			.andExpect(jsonPath("$[1].status").value("ARCHIVED"))
			.andExpect(jsonPath("$[1].presentationMode").value("CARD_ONLY"))
			.andExpect(jsonPath("$[2].slug").value("published-detail"))
			.andExpect(jsonPath("$[2].presentationMode").value("DETAIL"))
			.andExpect(jsonPath("$[3]").doesNotExist());
	}

	@Test
	void statusFiltersReturnOnlyPublishedOrArchivedPublicProjects() throws Exception {
		saveTranslatedProject("draft-fixture", ProjectStatus.DRAFT, false, 10);
		saveTranslatedProject("published-fixture", ProjectStatus.PUBLISHED, false, 20);
		saveTranslatedProject("archived-fixture", ProjectStatus.ARCHIVED, false, 30);

		this.mockMvc.perform(get("/api/v1/projects").queryParam("locale", "en").queryParam("status", "PUBLISHED"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].slug").value("published-fixture"))
			.andExpect(jsonPath("$[0].status").value("PUBLISHED"))
			.andExpect(jsonPath("$[1]").doesNotExist());

		this.mockMvc.perform(get("/api/v1/projects").queryParam("locale", "en").queryParam("status", "ARCHIVED"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].slug").value("archived-fixture"))
			.andExpect(jsonPath("$[0].status").value("ARCHIVED"))
			.andExpect(jsonPath("$[1]").doesNotExist());
	}

	@Test
	void featuredEndpointReturnsOnlyFeaturedPublishedProjects() throws Exception {
		saveTranslatedProject("featured-published", ProjectStatus.PUBLISHED, true, 10);
		saveTranslatedProject("regular-published", ProjectStatus.PUBLISHED, false, 20);
		saveTranslatedProject("featured-archived", ProjectStatus.ARCHIVED, true, 30);
		saveTranslatedProject("featured-draft", ProjectStatus.DRAFT, true, 40);

		this.mockMvc.perform(get("/api/v1/projects/featured").queryParam("locale", "en"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].slug").value("featured-published"))
			.andExpect(jsonPath("$[0].featured").value(true))
			.andExpect(jsonPath("$[0].status").value("PUBLISHED"))
			.andExpect(jsonPath("$[1]").doesNotExist());
	}

	@Test
	void detailReturnsLocalizedDtoWithOrderedTechnologiesAndAvailableLocales() throws Exception {
		TechnologyEntity angular = saveTechnology("Angular", "angular", "framework");
		TechnologyEntity springBoot = saveTechnology("Spring Boot", "spring-boot", "framework");
		ProjectEntity project = saveSectionedProject("detail-fixture", ProjectStatus.PUBLISHED,
				ProjectPresentationMode.DETAIL, true, 10);

		project.setLogoMediaRef("/assets/projects/detail-fixture.svg");
		project.setGithubUrl("https://example.test/detail-fixture.git");
		project.setDemoUrl("https://demo.example.test/detail-fixture");
		project.addTechnology(springBoot, 20);
		project.addTechnology(angular, 10);
		this.projectRepository.saveAndFlush(project);

		this.mockMvc.perform(get("/api/v1/projects/detail-fixture").queryParam("locale", "en"))
			.andExpect(status().isOk())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
			.andExpect(jsonPath("$.slug").value("detail-fixture"))
			.andExpect(jsonPath("$.title").value("detail-fixture EN"))
			.andExpect(jsonPath("$.shortDescription").value("English short description for detail-fixture"))
			.andExpect(jsonPath("$.detailedDescription").value("English detailed description for detail-fixture"))
			.andExpect(jsonPath("$.logoMediaRef").value("/assets/projects/detail-fixture.svg"))
			.andExpect(jsonPath("$.githubUrl").value("https://example.test/detail-fixture.git"))
			.andExpect(jsonPath("$.demoUrl").value("https://demo.example.test/detail-fixture"))
			.andExpect(jsonPath("$.featured").value(true))
			.andExpect(jsonPath("$.status").value("PUBLISHED"))
			.andExpect(jsonPath("$.presentationMode").value("DETAIL"))
			.andExpect(jsonPath("$.displayOrder").value(10))
			.andExpect(jsonPath("$.technologies[0].slug").value("angular"))
			.andExpect(jsonPath("$.technologies[1].slug").value("spring-boot"))
			.andExpect(jsonPath("$.sections[0].title").value("Context"))
			.andExpect(jsonPath("$.sections[0].content").value("English section body for detail-fixture"))
			.andExpect(jsonPath("$.sections[1].title").value("Architecture"))
			.andExpect(jsonPath("$.sections[1].content").value("English architecture body for detail-fixture"))
			.andExpect(jsonPath("$.availableLocales[0]").value("en"))
			.andExpect(jsonPath("$.availableLocales[1]").value("fr"))
			.andExpect(content().string(not(containsString("createdAt"))))
			.andExpect(content().string(not(containsString("updatedAt"))));
	}

	@Test
	void draftSlugLookupBehavesAsNotFound() throws Exception {
		saveTranslatedProject("private-fixture", ProjectStatus.DRAFT, ProjectPresentationMode.DETAIL, false, 10);

		this.mockMvc.perform(get("/api/v1/projects/private-fixture").queryParam("locale", "en"))
			.andExpect(status().isNotFound())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
			.andExpect(jsonPath("$.code").value("project_not_found"));
	}

	@Test
	void cardOnlySlugLookupBehavesAsNotFoundEvenWhenProjectIsPublic() throws Exception {
		saveTranslatedProject("card-only-fixture", ProjectStatus.PUBLISHED, ProjectPresentationMode.CARD_ONLY, false,
				10);

		this.mockMvc.perform(get("/api/v1/projects/card-only-fixture").queryParam("locale", "en"))
			.andExpect(status().isNotFound())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
			.andExpect(jsonPath("$.code").value("project_not_found"));
	}

	@Test
	void missingRequestedTranslationIsOmittedFromListsAndNotFoundForDetail() throws Exception {
		ProjectEntity project = project("english-only-fixture", ProjectStatus.PUBLISHED, ProjectPresentationMode.DETAIL,
				10);

		project.addTranslation(ProjectLocale.EN, "English only", "English only short description", null);
		this.projectRepository.saveAndFlush(project);

		this.mockMvc.perform(get("/api/v1/projects").queryParam("locale", "fr"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0]").doesNotExist());

		this.mockMvc.perform(get("/api/v1/projects/english-only-fixture").queryParam("locale", "fr"))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("project_not_found"));
	}

	@Test
	void unsupportedLocaleAndInvalidStatusReturnBadRequest() throws Exception {
		this.mockMvc.perform(get("/api/v1/projects").queryParam("locale", "de"))
			.andExpect(status().isBadRequest())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
			.andExpect(jsonPath("$.code").value("unsupported_locale"));

		this.mockMvc.perform(get("/api/v1/projects").queryParam("locale", "en").queryParam("status", "DRAFT"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("invalid_project_status"));

		this.mockMvc.perform(get("/api/v1/projects").queryParam("locale", "en").queryParam("status", ""))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("invalid_project_status"));

		this.mockMvc.perform(get("/api/v1/projects").queryParam("locale", "en").queryParam("status", "   "))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("invalid_project_status"));

		this.mockMvc.perform(get("/api/v1/projects").queryParam("locale", "en").queryParam("status", "DELETED"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("invalid_project_status"));
	}

	@Test
	void nullableLinksMediaAndDetailedDescriptionRemainExplicitlyNullable() throws Exception {
		ProjectEntity project = project("minimal-fixture", ProjectStatus.ARCHIVED, ProjectPresentationMode.DETAIL, 10);

		project.addTranslation(ProjectLocale.EN, "Minimal fixture", "Minimal short description", null);
		this.projectRepository.saveAndFlush(project);

		this.mockMvc.perform(get("/api/v1/projects/minimal-fixture").queryParam("locale", "en"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.detailedDescription").value(nullValue()))
			.andExpect(jsonPath("$.logoMediaRef").value(nullValue()))
			.andExpect(jsonPath("$.githubUrl").value(nullValue()))
			.andExpect(jsonPath("$.demoUrl").value(nullValue()))
			.andExpect(jsonPath("$.technologies").isArray())
			.andExpect(jsonPath("$.sections").isArray())
			.andExpect(jsonPath("$.sections[0]").doesNotExist());
	}

	@Test
	void missingSectionTranslationIsOmittedWithoutLocaleFallback() throws Exception {
		ProjectEntity project = project("partial-section-fixture", ProjectStatus.PUBLISHED,
				ProjectPresentationMode.DETAIL, 10);

		project.addTranslation(ProjectLocale.EN, "Partial EN", "English short description", null);
		project.addTranslation(ProjectLocale.FR, "Partial FR", "Description courte francaise", null);
		project.addSection(10).addTranslation(ProjectLocale.EN, "English only section", "English only section body");
		this.projectRepository.saveAndFlush(project);

		this.mockMvc.perform(get("/api/v1/projects/partial-section-fixture").queryParam("locale", "fr"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.sections").isArray())
			.andExpect(jsonPath("$.sections[0]").doesNotExist())
			.andExpect(content().string(not(containsString("English only section"))));
	}

	private ProjectEntity saveTranslatedProject(String slug, ProjectStatus status, boolean featured, int displayOrder) {
		return saveTranslatedProject(slug, status, ProjectPresentationMode.DETAIL, featured, displayOrder);
	}

	private ProjectEntity saveTranslatedProject(String slug, ProjectStatus status, ProjectPresentationMode presentationMode,
			boolean featured, int displayOrder) {
		ProjectEntity project = project(slug, status, presentationMode, displayOrder);

		project.setFeatured(featured);
		project.addTranslation(ProjectLocale.EN, slug + " EN", "English short description for " + slug,
				"English detailed description for " + slug);
		project.addTranslation(ProjectLocale.FR, slug + " FR", "Description courte francaise pour " + slug,
				"Description detaillee francaise pour " + slug);

		return this.projectRepository.saveAndFlush(project);
	}

	private ProjectEntity saveSectionedProject(String slug, ProjectStatus status, ProjectPresentationMode presentationMode,
			boolean featured, int displayOrder) {
		ProjectEntity project = project(slug, status, presentationMode, displayOrder);

		project.setFeatured(featured);
		project.addTranslation(ProjectLocale.EN, slug + " EN", "English short description for " + slug,
				"English detailed description for " + slug);
		project.addTranslation(ProjectLocale.FR, slug + " FR", "Description courte francaise pour " + slug,
				"Description detaillee francaise pour " + slug);
		ProjectSectionEntity context = project.addSection(10);
		context.addTranslation(ProjectLocale.EN, "Context", "English section body for " + slug);
		context.addTranslation(ProjectLocale.FR, "Contexte", "French section body for " + slug);
		ProjectSectionEntity architecture = project.addSection(20);
		architecture.addTranslation(ProjectLocale.EN, "Architecture", "English architecture body for " + slug);
		architecture.addTranslation(ProjectLocale.FR, "Architecture", "French architecture body for " + slug);

		return this.projectRepository.saveAndFlush(project);
	}

	private ProjectEntity saveTranslatedProject(String slug, ProjectStatus status, boolean featured) {
		return saveTranslatedProject(slug, status, featured, 10);
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

	private TechnologyEntity saveTechnology(String name, String slug, String category) {
		TechnologyEntity technology = new TechnologyEntity(name, slug);

		technology.setCategory(category);
		technology.setIconRef("icons/" + slug + ".svg");

		return this.technologyRepository.saveAndFlush(technology);
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
