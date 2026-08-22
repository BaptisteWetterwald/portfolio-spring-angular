package fr.bwetterwald.portfolio.project.api;

import java.time.Instant;

import fr.bwetterwald.portfolio.project.domain.ProjectLocale;
import fr.bwetterwald.portfolio.project.domain.ProjectStatus;
import fr.bwetterwald.portfolio.project.persistence.ProjectEntity;
import fr.bwetterwald.portfolio.project.persistence.ProjectRepository;
import fr.bwetterwald.portfolio.support.AbstractPostgresSpringTest;
import fr.bwetterwald.portfolio.technology.persistence.TechnologyEntity;
import fr.bwetterwald.portfolio.technology.persistence.TechnologyRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
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

	@Test
	void publicListReturnsRequestedLocaleAndExcludesDraftProjects() throws Exception {
		saveTranslatedProject("draft-fixture", ProjectStatus.DRAFT, false, 10);
		saveTranslatedProject("published-fixture", ProjectStatus.PUBLISHED, false, 20);
		saveTranslatedProject("archived-fixture", ProjectStatus.ARCHIVED, false, 30);

		this.mockMvc.perform(get("/api/v1/projects").queryParam("locale", "fr"))
			.andExpect(status().isOk())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
			.andExpect(jsonPath("$[0].slug").value("published-fixture"))
			.andExpect(jsonPath("$[0].title").value("published-fixture FR"))
			.andExpect(jsonPath("$[0].status").value("PUBLISHED"))
			.andExpect(jsonPath("$[1].slug").value("archived-fixture"))
			.andExpect(jsonPath("$[1].title").value("archived-fixture FR"))
			.andExpect(jsonPath("$[1].status").value("ARCHIVED"))
			.andExpect(jsonPath("$[2]").doesNotExist());
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
		ProjectEntity project = saveTranslatedProject("detail-fixture", ProjectStatus.PUBLISHED, true, 10);

		project.setLogoMediaRef("media/projects/detail-fixture.svg");
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
			.andExpect(jsonPath("$.logoMediaRef").value("media/projects/detail-fixture.svg"))
			.andExpect(jsonPath("$.githubUrl").value("https://example.test/detail-fixture.git"))
			.andExpect(jsonPath("$.demoUrl").value("https://demo.example.test/detail-fixture"))
			.andExpect(jsonPath("$.featured").value(true))
			.andExpect(jsonPath("$.status").value("PUBLISHED"))
			.andExpect(jsonPath("$.displayOrder").value(10))
			.andExpect(jsonPath("$.technologies[0].slug").value("angular"))
			.andExpect(jsonPath("$.technologies[1].slug").value("spring-boot"))
			.andExpect(jsonPath("$.availableLocales[0]").value("en"))
			.andExpect(jsonPath("$.availableLocales[1]").value("fr"))
			.andExpect(content().string(not(containsString("createdAt"))))
			.andExpect(content().string(not(containsString("updatedAt"))));
	}

	@Test
	void draftSlugLookupBehavesAsNotFound() throws Exception {
		saveTranslatedProject("private-fixture", ProjectStatus.DRAFT, false, 10);

		this.mockMvc.perform(get("/api/v1/projects/private-fixture").queryParam("locale", "en"))
			.andExpect(status().isNotFound())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
			.andExpect(jsonPath("$.code").value("project_not_found"));
	}

	@Test
	void missingRequestedTranslationIsOmittedFromListsAndNotFoundForDetail() throws Exception {
		ProjectEntity project = project("english-only-fixture", ProjectStatus.PUBLISHED, 10);

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
		ProjectEntity project = project("minimal-fixture", ProjectStatus.ARCHIVED, 10);

		project.addTranslation(ProjectLocale.EN, "Minimal fixture", "Minimal short description", null);
		this.projectRepository.saveAndFlush(project);

		this.mockMvc.perform(get("/api/v1/projects/minimal-fixture").queryParam("locale", "en"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.detailedDescription").value(nullValue()))
			.andExpect(jsonPath("$.logoMediaRef").value(nullValue()))
			.andExpect(jsonPath("$.githubUrl").value(nullValue()))
			.andExpect(jsonPath("$.demoUrl").value(nullValue()))
			.andExpect(jsonPath("$.technologies").isArray());
	}

	private ProjectEntity saveTranslatedProject(String slug, ProjectStatus status, boolean featured, int displayOrder) {
		ProjectEntity project = project(slug, status, displayOrder);

		project.setFeatured(featured);
		project.addTranslation(ProjectLocale.EN, slug + " EN", "English short description for " + slug,
				"English detailed description for " + slug);
		project.addTranslation(ProjectLocale.FR, slug + " FR", "Description courte francaise pour " + slug,
				"Description detaillee francaise pour " + slug);

		return this.projectRepository.saveAndFlush(project);
	}

	private ProjectEntity saveTranslatedProject(String slug, ProjectStatus status, boolean featured) {
		return saveTranslatedProject(slug, status, featured, 10);
	}

	private static ProjectEntity project(String slug, ProjectStatus status, int displayOrder) {
		ProjectEntity project = new ProjectEntity(slug, status, displayOrder);

		project.setPublishedAt(Instant.parse("2026-01-15T10:00:00Z"));

		return project;
	}

	private TechnologyEntity saveTechnology(String name, String slug, String category) {
		TechnologyEntity technology = new TechnologyEntity(name, slug);

		technology.setCategory(category);
		technology.setIconRef("icons/" + slug + ".svg");

		return this.technologyRepository.saveAndFlush(technology);
	}

}
