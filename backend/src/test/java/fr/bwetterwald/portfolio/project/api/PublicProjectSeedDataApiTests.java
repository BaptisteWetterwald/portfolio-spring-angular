package fr.bwetterwald.portfolio.project.api;

import fr.bwetterwald.portfolio.support.AbstractPostgresSpringTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
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
class PublicProjectSeedDataApiTests extends AbstractPostgresSpringTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Test
	void hungarianProjectsAndStructuredDetailsAreAvailable() throws Exception {
		this.mockMvc.perform(get("/api/v1/projects").queryParam("locale", "hu"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(6))
			.andExpect(jsonPath("$[0].shortDescription").value(containsString("Többnyelvű")));
		for (String slug : new String[] { "portfolio-spring-angular", "blaze4" }) {
			this.mockMvc.perform(get("/api/v1/projects/{slug}", slug).queryParam("locale", "hu"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.sections.length()").value(4))
				.andExpect(jsonPath("$.sections[0].title").value("Háttér"))
				.andExpect(jsonPath("$.availableLocales[2]").value("hu"));
		}
	}

	@Test
	void productionSeedContainsSixOrderedProjectsExactlyOnce() {
		String schema = isolatedPostgresSchema();

		assertThat(this.jdbcTemplate.queryForObject("""
				select count(*)
				from %s.projects
				""".formatted(schema), Integer.class)).isEqualTo(6);
		assertThat(this.jdbcTemplate.queryForList("""
				select slug || ':' || display_order
				from %s.projects
				where status = 'PUBLISHED'
				order by display_order asc, published_at desc, id asc
				""".formatted(schema), String.class)).containsExactly("portfolio-spring-angular:10", "blaze4:20",
						"frequensisa:30", "summercamp:40", "bot-discord-ir:50",
						"beamng-drive-beepbeep-3:60");
		assertThat(this.jdbcTemplate.queryForObject("""
				select count(*)
				from %s.projects
				where slug = 'beamng-drive-beepbeep-3'
				and status = 'PUBLISHED'
				and presentation_mode = 'CARD_ONLY'
				""".formatted(schema), Integer.class)).isEqualTo(1);
		assertThat(this.jdbcTemplate.queryForObject("""
				select count(*)
				from %s.projects
				where slug = 'blaze4'
				and status = 'PUBLISHED'
				and presentation_mode = 'DETAIL'
				""".formatted(schema), Integer.class)).isEqualTo(1);
		assertThat(this.jdbcTemplate.queryForObject("""
				select count(*)
				from %s.projects
				where slug = 'portfolio-spring-angular'
				and status = 'PUBLISHED'
				and presentation_mode = 'DETAIL'
				and github_url = 'https://github.com/BaptisteWetterwald/portfolio-spring-angular'
				and demo_url is null
				and logo_media_ref is null
				""".formatted(schema), Integer.class)).isEqualTo(1);
		assertThat(this.jdbcTemplate.queryForObject("""
				select count(*)
				from %s.projects
				where slug = 'frequensisa'
				and status = 'PUBLISHED'
				and presentation_mode = 'CARD_ONLY'
				and github_url = 'https://github.com/BaptisteWetterwald/ecole-ios-frequensisa'
				and demo_url is null
				and logo_media_ref is null
				""".formatted(schema), Integer.class)).isEqualTo(1);
		assertThat(this.jdbcTemplate.queryForObject("""
				select count(*)
				from %s.projects
				where slug = 'summercamp'
				and status = 'PUBLISHED'
				and presentation_mode = 'CARD_ONLY'
				and github_url = 'https://github.com/BaptisteWetterwald/ecole-android-summercamp'
				and demo_url is null
				and logo_media_ref is null
				""".formatted(schema), Integer.class)).isEqualTo(1);
		assertThat(this.jdbcTemplate.queryForObject("""
				select count(*)
				from %s.projects
				where slug = 'bot-discord-ir'
				and status = 'PUBLISHED'
				and presentation_mode = 'CARD_ONLY'
				and github_url = 'https://github.com/BaptisteWetterwald/discord-bot-ensisa-ir'
				and demo_url is null
				and logo_media_ref is null
				""".formatted(schema), Integer.class)).isEqualTo(1);
		assertThat(this.jdbcTemplate.queryForObject("""
				select count(*)
				from %s.project_sections section
				join %s.projects project on project.id = section.project_id
				where project.slug = 'blaze4'
				""".formatted(schema, schema), Integer.class)).isEqualTo(4);
		assertThat(this.jdbcTemplate.queryForObject("""
				select count(*)
				from %s.project_sections section
				join %s.projects project on project.id = section.project_id
				where project.slug = 'portfolio-spring-angular'
				""".formatted(schema, schema), Integer.class)).isEqualTo(4);
		assertThat(this.jdbcTemplate.queryForObject("""
				select count(*)
				from %s.project_sections section
				join %s.projects project on project.id = section.project_id
				where project.slug in ('frequensisa', 'summercamp', 'bot-discord-ir')
				""".formatted(schema, schema), Integer.class)).isZero();
		assertThat(this.jdbcTemplate.queryForObject("""
				select count(*)
				from %s.project_section_translations translation
				join %s.project_sections section on section.id = translation.section_id
				join %s.projects project on project.id = section.project_id
				where project.slug = 'blaze4'
				and translation.locale in ('fr', 'en')
				""".formatted(schema, schema, schema), Integer.class)).isEqualTo(8);
		assertThat(this.jdbcTemplate.queryForObject("""
				select count(*)
				from %s.project_section_translations translation
				join %s.project_sections section on section.id = translation.section_id
				join %s.projects project on project.id = section.project_id
				where project.slug = 'portfolio-spring-angular'
				and translation.locale in ('fr', 'en')
				""".formatted(schema, schema, schema), Integer.class)).isEqualTo(8);
		assertThat(this.jdbcTemplate.queryForObject("""
				select count(*)
				from %s.project_translations translation
				join %s.projects project on project.id = translation.project_id
				where project.slug = 'blaze4'
				and translation.locale in ('fr', 'en')
				""".formatted(schema, schema), Integer.class)).isEqualTo(2);
		assertThat(this.jdbcTemplate.queryForObject("""
				select count(*)
				from %s.project_translations translation
				join %s.projects project on project.id = translation.project_id
				where project.slug = 'portfolio-spring-angular'
				and translation.locale in ('fr', 'en')
				and translation.detailed_description is null
				""".formatted(schema, schema), Integer.class)).isEqualTo(2);
		assertThat(this.jdbcTemplate.queryForObject("""
				select count(*)
				from %s.project_translations translation
				join %s.projects project on project.id = translation.project_id
				where project.slug in ('frequensisa', 'summercamp', 'bot-discord-ir')
				and translation.locale in ('fr', 'en')
				and translation.detailed_description is null
				and length(btrim(translation.title)) > 0
				and length(btrim(translation.short_description)) > 0
				""".formatted(schema, schema), Integer.class)).isEqualTo(6);
	}

	@Test
	void publicListReturnsSeededProjectsForEachLocale() throws Exception {
		this.mockMvc.perform(get("/api/v1/projects").queryParam("locale", "en"))
			.andExpect(status().isOk())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
			.andExpect(jsonPath("$[0].slug").value("portfolio-spring-angular"))
			.andExpect(jsonPath("$[0].title").value("Portfolio Spring Angular"))
			.andExpect(jsonPath("$[0].shortDescription")
				.value("Multilingual portfolio application built with Angular SSR, Spring Boot, PostgreSQL and Flyway to serve localized content and structured project case studies."))
			.andExpect(jsonPath("$[0].status").value("PUBLISHED"))
			.andExpect(jsonPath("$[0].presentationMode").value("DETAIL"))
			.andExpect(jsonPath("$[0].featured").value(false))
			.andExpect(jsonPath("$[0].logoMediaRef").value(nullValue()))
			.andExpect(jsonPath("$[0].githubUrl")
				.value("https://github.com/BaptisteWetterwald/portfolio-spring-angular"))
			.andExpect(jsonPath("$[0].demoUrl").value(nullValue()))
			.andExpect(jsonPath("$[0].displayOrder").value(10))
			.andExpect(jsonPath("$[0].sections").doesNotExist())
			.andExpect(jsonPath("$[0].technologies[0].slug").value("angular"))
			.andExpect(jsonPath("$[0].technologies[1].slug").value("typescript"))
			.andExpect(jsonPath("$[0].technologies[2].slug").value("java"))
			.andExpect(jsonPath("$[0].technologies[3].slug").value("spring-boot"))
			.andExpect(jsonPath("$[0].technologies[4].slug").value("postgresql"))
			.andExpect(jsonPath("$[0].technologies[5].slug").value("flyway"))
			.andExpect(jsonPath("$[0].technologies[6].slug").value("angular-ssr"))
			.andExpect(jsonPath("$[0].technologies[7].slug").value("tailwind-css"))
			.andExpect(jsonPath("$[0].technologies[8].slug").value("daisyui"))
			.andExpect(jsonPath("$[0].technologies[9].slug").value("docker-compose"))
			.andExpect(jsonPath("$[1].slug").value("blaze4"))
			.andExpect(jsonPath("$[1].title").value("Blaze4"))
			.andExpect(jsonPath("$[1].shortDescription")
				.value("Connect Four web application built with C#/.NET using an N-tier architecture, an ASP.NET Core REST API, a Blazor WebAssembly frontend and Entity Framework Core persistence."))
			.andExpect(jsonPath("$[1].status").value("PUBLISHED"))
			.andExpect(jsonPath("$[1].presentationMode").value("DETAIL"))
			.andExpect(jsonPath("$[1].featured").value(false))
			.andExpect(jsonPath("$[1].logoMediaRef").value(nullValue()))
			.andExpect(jsonPath("$[1].githubUrl")
				.value("https://github.com/BaptisteWetterwald/ecole-ntiers-projet-blaze4"))
			.andExpect(jsonPath("$[1].demoUrl").value(nullValue()))
			.andExpect(jsonPath("$[1].displayOrder").value(20))
			.andExpect(jsonPath("$[1].technologies[0].slug").value("c-sharp"))
			.andExpect(jsonPath("$[1].technologies[1].slug").value("dotnet"))
			.andExpect(jsonPath("$[1].technologies[2].slug").value("aspnet-core"))
			.andExpect(jsonPath("$[1].technologies[3].slug").value("blazor-webassembly"))
			.andExpect(jsonPath("$[1].technologies[4].slug").value("entity-framework-core"))
			.andExpect(jsonPath("$[1].technologies[5].slug").value("sqlite"))
			.andExpect(jsonPath("$[2].slug").value("frequensisa"))
			.andExpect(jsonPath("$[2].title").value("Frequensisa"))
			.andExpect(jsonPath("$[2].shortDescription")
				.value("iOS application for listening to and managing Internet radio stations, built in Swift with SQLite persistence and AVPlayer audio playback."))
			.andExpect(jsonPath("$[2].status").value("PUBLISHED"))
			.andExpect(jsonPath("$[2].presentationMode").value("CARD_ONLY"))
			.andExpect(jsonPath("$[2].featured").value(false))
			.andExpect(jsonPath("$[2].logoMediaRef").value(nullValue()))
			.andExpect(jsonPath("$[2].githubUrl")
				.value("https://github.com/BaptisteWetterwald/ecole-ios-frequensisa"))
			.andExpect(jsonPath("$[2].demoUrl").value(nullValue()))
			.andExpect(jsonPath("$[2].displayOrder").value(30))
			.andExpect(jsonPath("$[2].technologies[0].slug").value("swift"))
			.andExpect(jsonPath("$[2].technologies[1].slug").value("swiftui"))
			.andExpect(jsonPath("$[2].technologies[2].slug").value("sqlite"))
			.andExpect(jsonPath("$[3].slug").value("summercamp"))
			.andExpect(jsonPath("$[3].title").value("SummerCamp"))
			.andExpect(jsonPath("$[3].shortDescription")
				.value("Android summer-camp management application built with Kotlin, Jetpack Compose and Room persistence."))
			.andExpect(jsonPath("$[3].presentationMode").value("CARD_ONLY"))
			.andExpect(jsonPath("$[3].githubUrl")
				.value("https://github.com/BaptisteWetterwald/ecole-android-summercamp"))
			.andExpect(jsonPath("$[3].displayOrder").value(40))
			.andExpect(jsonPath("$[3].technologies[0].slug").value("kotlin"))
			.andExpect(jsonPath("$[3].technologies[1].slug").value("jetpack-compose"))
			.andExpect(jsonPath("$[3].technologies[2].slug").value("android"))
			.andExpect(jsonPath("$[3].technologies[3].slug").value("room"))
			.andExpect(jsonPath("$[4].slug").value("bot-discord-ir"))
			.andExpect(jsonPath("$[4].title").value("Bot Discord IR"))
			.andExpect(jsonPath("$[4].shortDescription")
				.value("Discord bot built with Node.js to centralize commands and utilities for the ENSISA Computer Science and Networks class."))
			.andExpect(jsonPath("$[4].presentationMode").value("CARD_ONLY"))
			.andExpect(jsonPath("$[4].githubUrl")
				.value("https://github.com/BaptisteWetterwald/discord-bot-ensisa-ir"))
			.andExpect(jsonPath("$[4].displayOrder").value(50))
			.andExpect(jsonPath("$[4].technologies[0].slug").value("node-js"))
			.andExpect(jsonPath("$[4].technologies[1].slug").value("javascript"))
			.andExpect(jsonPath("$[4].technologies[2].slug").value("discord-js"))
			.andExpect(jsonPath("$[4].technologies[3].slug").value("sqlite"))
			.andExpect(jsonPath("$[5].slug").value("beamng-drive-beepbeep-3"))
			.andExpect(jsonPath("$[5].title").value("BeamNG.drive x BeepBeep 3"))
			.andExpect(jsonPath("$[5].status").value("PUBLISHED"))
			.andExpect(jsonPath("$[5].presentationMode").value("CARD_ONLY"))
			.andExpect(jsonPath("$[5].featured").value(false))
			.andExpect(jsonPath("$[5].logoMediaRef").value(nullValue()))
			.andExpect(jsonPath("$[5].githubUrl").value(nullValue()))
			.andExpect(jsonPath("$[5].demoUrl").value(nullValue()))
			.andExpect(jsonPath("$[5].displayOrder").value(60))
			.andExpect(jsonPath("$[5].technologies[0].slug").value("java"))
			.andExpect(jsonPath("$[5].technologies[1].slug").value("python"))
			.andExpect(jsonPath("$[5].technologies[2].slug").value("sockets"))
			.andExpect(jsonPath("$[5].technologies[3].slug").value("beamng-drive"))
			.andExpect(jsonPath("$[5].technologies[4].slug").value("beepbeep-3"))
			.andExpect(jsonPath("$[6]").doesNotExist())
			.andExpect(content().string(not(containsString("\"sections\""))));

		this.mockMvc.perform(get("/api/v1/projects").queryParam("locale", "fr"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].slug").value("portfolio-spring-angular"))
			.andExpect(jsonPath("$[0].shortDescription").value(containsString("Application portfolio multilingue")))
			.andExpect(jsonPath("$[1].slug").value("blaze4"))
			.andExpect(jsonPath("$[1].shortDescription")
				.value("Application web de Puissance 4 en C#/.NET, construite autour d'une architecture N-tiers avec API REST ASP.NET Core, frontend Blazor WebAssembly et persistance via Entity Framework Core."))
			.andExpect(jsonPath("$[2].slug").value("frequensisa"))
			.andExpect(jsonPath("$[2].shortDescription").value(containsString("AVPlayer")))
			.andExpect(jsonPath("$[2].sections").doesNotExist())
			.andExpect(jsonPath("$[3].slug").value("summercamp"))
			.andExpect(jsonPath("$[3].shortDescription").value(containsString("Jetpack Compose")))
			.andExpect(jsonPath("$[4].slug").value("bot-discord-ir"))
			.andExpect(jsonPath("$[4].shortDescription").value(containsString("Node.js")))
			.andExpect(jsonPath("$[5].slug").value("beamng-drive-beepbeep-3"))
			.andExpect(jsonPath("$[5].shortDescription").value(containsString("Stage acad")))
			.andExpect(jsonPath("$[6]").doesNotExist());
	}

	@Test
	void publicFiltersExposeSeededProjectsOnlyThroughPublishedEndpoints() throws Exception {
		this.mockMvc.perform(get("/api/v1/projects").queryParam("locale", "en").queryParam("status", "PUBLISHED"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].slug").value("portfolio-spring-angular"))
			.andExpect(jsonPath("$[1].slug").value("blaze4"))
			.andExpect(jsonPath("$[2].slug").value("frequensisa"))
			.andExpect(jsonPath("$[3].slug").value("summercamp"))
			.andExpect(jsonPath("$[4].slug").value("bot-discord-ir"))
			.andExpect(jsonPath("$[5].slug").value("beamng-drive-beepbeep-3"))
			.andExpect(jsonPath("$[6]").doesNotExist());

		this.mockMvc.perform(get("/api/v1/projects").queryParam("locale", "en").queryParam("status", "ARCHIVED"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0]").doesNotExist());

		this.mockMvc.perform(get("/api/v1/projects/featured").queryParam("locale", "en"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0]").doesNotExist());
	}

	@Test
	void localizedDetailForSeededBlaze4ProjectSucceedsForEachLocale() throws Exception {
		this.mockMvc.perform(get("/api/v1/projects/blaze4").queryParam("locale", "fr"))
			.andExpect(status().isOk())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
			.andExpect(jsonPath("$.slug").value("blaze4"))
			.andExpect(jsonPath("$.title").value("Blaze4"))
			.andExpect(jsonPath("$.shortDescription")
				.value("Application web de Puissance 4 en C#/.NET, construite autour d'une architecture N-tiers avec API REST ASP.NET Core, frontend Blazor WebAssembly et persistance via Entity Framework Core."))
			.andExpect(jsonPath("$.detailedDescription").value(containsString("architectures N-tiers")))
			.andExpect(jsonPath("$.detailedDescription").value(containsString("authentification JWT")))
			.andExpect(jsonPath("$.sections[0].title").value("Contexte"))
			.andExpect(jsonPath("$.sections[0].content")
				.value("Blaze4 est une application web de Puissance 4 réalisée dans le cadre d'un projet consacré aux architectures N-tiers. L'objectif principal était de séparer clairement la logique métier, l'accès aux données et l'interface utilisateur."))
			.andExpect(jsonPath("$.sections[1].title").value("Architecture"))
			.andExpect(jsonPath("$.sections[1].content")
				.value("L'application est organisée en plusieurs projets .NET : une couche applicative exposant une API REST ASP.NET Core, une couche d'accès aux données basée sur Entity Framework Core, un frontend Blazor WebAssembly, un projet de DTOs partagés et un projet de tests."))
			.andExpect(jsonPath("$.sections[2].title").value("Logique métier et API"))
			.andExpect(jsonPath("$.sections[2].content")
				.value("Le backend prend en charge la création des parties, le déroulement du jeu et la validation des tours. Les concepts métier du Puissance 4 sont représentés par des modèles dédiés, tandis que des services, repositories et mappers assurent la séparation entre logique métier, persistance et contrats d'API."))
			.andExpect(jsonPath("$.sections[3].title").value("Authentification et persistance"))
			.andExpect(jsonPath("$.sections[3].content")
				.value("L'application propose l'inscription et la connexion des joueurs avec authentification JWT. Les données sont persistées dans une base SQLite via Entity Framework Core et ses migrations."))
			.andExpect(jsonPath("$.status").value("PUBLISHED"))
			.andExpect(jsonPath("$.presentationMode").value("DETAIL"))
			.andExpect(jsonPath("$.githubUrl")
				.value("https://github.com/BaptisteWetterwald/ecole-ntiers-projet-blaze4"))
			.andExpect(jsonPath("$.demoUrl").value(nullValue()))
			.andExpect(jsonPath("$.technologies[0].name").value("C#"))
			.andExpect(jsonPath("$.technologies[1].name").value(".NET"))
			.andExpect(jsonPath("$.technologies[2].name").value("ASP.NET Core"))
			.andExpect(jsonPath("$.technologies[3].name").value("Blazor WebAssembly"))
			.andExpect(jsonPath("$.technologies[4].name").value("Entity Framework Core"))
			.andExpect(jsonPath("$.technologies[5].name").value("SQLite"))
			.andExpect(jsonPath("$.availableLocales[0]").value("en"))
			.andExpect(jsonPath("$.availableLocales[1]").value("fr"));

		this.mockMvc.perform(get("/api/v1/projects/blaze4").queryParam("locale", "en"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.shortDescription")
				.value("Connect Four web application built with C#/.NET using an N-tier architecture, an ASP.NET Core REST API, a Blazor WebAssembly frontend and Entity Framework Core persistence."))
			.andExpect(jsonPath("$.detailedDescription").value(containsString("N-tier architectures")))
			.andExpect(jsonPath("$.detailedDescription").value(containsString("JWT authentication")))
			.andExpect(jsonPath("$.sections[0].title").value("Context"))
			.andExpect(jsonPath("$.sections[0].content")
				.value("Blaze4 is a Connect Four web application developed as part of an academic project focused on N-tier architectures. Its main architectural goal was to clearly separate business logic, data access and the user interface."))
			.andExpect(jsonPath("$.sections[1].title").value("Architecture"))
			.andExpect(jsonPath("$.sections[1].content")
				.value("The application is organized into several .NET projects: an application layer exposing an ASP.NET Core REST API, a data-access layer based on Entity Framework Core, a Blazor WebAssembly frontend, a shared DTO project and a test project."))
			.andExpect(jsonPath("$.sections[2].title").value("Business logic and API"))
			.andExpect(jsonPath("$.sections[2].content")
				.value("The backend handles game creation, gameplay and turn validation. Connect Four concepts are represented through dedicated domain models, while services, repositories and mappers separate business logic, persistence and API contracts."))
			.andExpect(jsonPath("$.sections[3].title").value("Authentication and persistence"))
			.andExpect(jsonPath("$.sections[3].content")
				.value("The application supports player registration and login using JWT authentication. Data is persisted in SQLite through Entity Framework Core and its migrations."));
	}

	@Test
	void localizedDetailForSeededPortfolioProjectSucceedsForEachLocale() throws Exception {
		this.mockMvc.perform(get("/api/v1/projects/portfolio-spring-angular").queryParam("locale", "fr"))
			.andExpect(status().isOk())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
			.andExpect(jsonPath("$.slug").value("portfolio-spring-angular"))
			.andExpect(jsonPath("$.title").value("Portfolio Spring Angular"))
			.andExpect(jsonPath("$.shortDescription")
				.value("Application portfolio multilingue construite avec Angular SSR, Spring Boot, PostgreSQL et Flyway pour servir du contenu localisé et des études de projets structurées."))
			.andExpect(jsonPath("$.detailedDescription").value(nullValue()))
			.andExpect(jsonPath("$.sections[0].title").value("Contexte"))
			.andExpect(jsonPath("$.sections[0].content")
				.value("Portfolio Spring Angular est l'application portfolio source de Baptiste Wetterwald. Elle présente du contenu professionnel localisé et des projets réels fournis par un backend Spring Boot et PostgreSQL."))
			.andExpect(jsonPath("$.sections[1].title").value("Architecture"))
			.andExpect(jsonPath("$.sections[1].content")
				.value("L'application est séparée entre un frontend Angular 22 avec SSR et un backend Spring Boot. PostgreSQL stocke les données projet, Flyway gère les migrations de schéma et Docker Compose assemble l'environnement local complet."))
			.andExpect(jsonPath("$.sections[2].title").value("Projets et contenu"))
			.andExpect(jsonPath("$.sections[2].content")
				.value("Les projets sont des entités gérées côté backend avec statut de publication, mode de présentation, traductions localisées, technologies ordonnées et sections de détail structurées. Le frontend Angular consomme des DTOs de liste compacts et des DTOs de détail enrichis via des resolvers de route."))
			.andExpect(jsonPath("$.sections[3].title").value("SSR, SEO et accessibilité"))
			.andExpect(jsonPath("$.sections[3].content")
				.value("Les routes localisées /fr, /en et /hu sont rendues à la requête. Le frontend applique des métadonnées localisées, des URL canoniques, des alternates hreflang et le noindex pour les pages de détail indisponibles, tout en conservant une navigation sémantique et des actions accessibles au clavier."))
			.andExpect(jsonPath("$.status").value("PUBLISHED"))
			.andExpect(jsonPath("$.presentationMode").value("DETAIL"))
			.andExpect(jsonPath("$.logoMediaRef").value(nullValue()))
			.andExpect(jsonPath("$.githubUrl")
				.value("https://github.com/BaptisteWetterwald/portfolio-spring-angular"))
			.andExpect(jsonPath("$.demoUrl").value(nullValue()))
			.andExpect(jsonPath("$.technologies[0].name").value("Angular"))
			.andExpect(jsonPath("$.technologies[1].name").value("TypeScript"))
			.andExpect(jsonPath("$.technologies[2].name").value("Java"))
			.andExpect(jsonPath("$.technologies[3].name").value("Spring Boot"))
			.andExpect(jsonPath("$.technologies[4].name").value("PostgreSQL"))
			.andExpect(jsonPath("$.technologies[5].name").value("Flyway"))
			.andExpect(jsonPath("$.technologies[6].name").value("Angular SSR"))
			.andExpect(jsonPath("$.technologies[7].name").value("Tailwind CSS"))
			.andExpect(jsonPath("$.technologies[8].name").value("daisyUI"))
			.andExpect(jsonPath("$.technologies[9].name").value("Docker Compose"))
			.andExpect(jsonPath("$.availableLocales[0]").value("en"))
			.andExpect(jsonPath("$.availableLocales[1]").value("fr"));

		this.mockMvc.perform(get("/api/v1/projects/portfolio-spring-angular").queryParam("locale", "en"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.shortDescription")
				.value("Multilingual portfolio application built with Angular SSR, Spring Boot, PostgreSQL and Flyway to serve localized content and structured project case studies."))
			.andExpect(jsonPath("$.detailedDescription").value(nullValue()))
			.andExpect(jsonPath("$.sections[0].title").value("Context"))
			.andExpect(jsonPath("$.sections[0].content")
				.value("Portfolio Spring Angular is the source-backed portfolio application for Baptiste Wetterwald. It presents localized professional content and real project records from a Spring Boot and PostgreSQL backend."))
			.andExpect(jsonPath("$.sections[1].title").value("Architecture"))
			.andExpect(jsonPath("$.sections[1].content")
				.value("The application is split into an Angular 22 SSR frontend and a Spring Boot backend. PostgreSQL stores project data, Flyway owns schema migrations and Docker Compose wires the local full-stack runtime."))
			.andExpect(jsonPath("$.sections[2].title").value("Projects and content"))
			.andExpect(jsonPath("$.sections[2].content")
				.value("Projects are backend-managed entities with publication status, presentation mode, localized translations, ordered technologies and structured detail sections. The Angular frontend consumes compact list DTOs and richer detail DTOs through route resolvers."))
			.andExpect(jsonPath("$.sections[3].title").value("SSR, SEO and accessibility"))
			.andExpect(jsonPath("$.sections[3].content")
				.value("Localized /fr, /en and /hu routes are rendered at request time. The frontend applies localized metadata, canonical URLs, hreflang alternates and noindex handling for unavailable project detail pages while keeping semantic navigation and keyboard-accessible actions."));
	}

	@Test
	void localizedDetailForSeededCardOnlyProjectsBehavesAsNotFound() throws Exception {
		for (String slug : new String[] { "beamng-drive-beepbeep-3", "frequensisa", "summercamp", "bot-discord-ir" }) {
			for (String locale : new String[] { "fr", "en", "hu" }) {
				this.mockMvc.perform(get("/api/v1/projects/{slug}", slug).queryParam("locale", locale))
					.andExpect(status().isNotFound())
					.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
					.andExpect(jsonPath("$.code").value("project_not_found"));
			}
		}
	}

}
