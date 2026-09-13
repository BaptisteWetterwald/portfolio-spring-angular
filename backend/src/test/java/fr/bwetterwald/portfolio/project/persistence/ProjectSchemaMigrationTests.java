package fr.bwetterwald.portfolio.project.persistence;

import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import fr.bwetterwald.portfolio.support.PostgresTestDatabase;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;

import static org.assertj.core.api.Assertions.assertThat;

class ProjectSchemaMigrationTests {

	@Test
	void flywayMigrationAppliesFromEmptyPostgresSchema() throws SQLException {
		String schema = PostgresTestDatabase.uniqueSchemaName();
		Flyway flyway = flyway(schema);

		try {
			var result = flyway.migrate();

			assertThat(result.migrationsExecuted).isEqualTo(10);
			assertThat(flyway.info().current().getVersion().toString()).isEqualTo("10");
			assertThat(tableExists(schema, "projects")).isTrue();
			assertThat(tableExists(schema, "project_translations")).isTrue();
			assertThat(tableExists(schema, "technologies")).isTrue();
			assertThat(tableExists(schema, "project_technologies")).isTrue();
			assertThat(tableExists(schema, "project_sections")).isTrue();
			assertThat(tableExists(schema, "project_section_translations")).isTrue();
			assertThat(columnExists(schema, "projects", "presentation_mode")).isTrue();
			assertThat(countPublicSeededProjects(schema)).isEqualTo(6);
			assertThat(seededPublicProjectSlugs(schema)).containsExactly("portfolio-spring-angular", "blaze4",
					"frequensisa", "summercamp", "bot-discord-ir", "beamng-drive-beepbeep-3");
			assertThat(seededProjectOrderValues(schema)).containsExactly("portfolio-spring-angular:10", "blaze4:20",
					"frequensisa:30", "summercamp:40", "bot-discord-ir:50", "beamng-drive-beepbeep-3:60");
			assertThat(countSeededBeamngRows(schema)).isEqualTo(1);
			assertThat(countSeededBlaze4Rows(schema)).isEqualTo(1);
			assertThat(countSeededPortfolioRows(schema)).isEqualTo(1);
			assertThat(countSeededCardOnlyProjectRows(schema, "frequensisa",
					"https://github.com/BaptisteWetterwald/ecole-ios-frequensisa")).isEqualTo(1);
			assertThat(countSeededCardOnlyProjectRows(schema, "summercamp",
					"https://github.com/BaptisteWetterwald/ecole-android-summercamp")).isEqualTo(1);
			assertThat(countSeededCardOnlyProjectRows(schema, "bot-discord-ir",
					"https://github.com/BaptisteWetterwald/discord-bot-ensisa-ir")).isEqualTo(1);
			assertThat(countSeededTranslations(schema, "beamng-drive-beepbeep-3")).isEqualTo(2);
			assertThat(countSeededTranslations(schema, "blaze4")).isEqualTo(2);
			assertThat(countSeededLocalizedTranslations(schema, "portfolio-spring-angular")).isEqualTo(2);
			assertThat(countSeededLocalizedTranslations(schema, "frequensisa")).isEqualTo(2);
			assertThat(countSeededLocalizedTranslations(schema, "summercamp")).isEqualTo(2);
			assertThat(countSeededLocalizedTranslations(schema, "bot-discord-ir")).isEqualTo(2);
			assertThat(countSeededNullDetailedDescriptions(schema, "portfolio-spring-angular")).isEqualTo(2);
			assertThat(countSeededNullDetailedDescriptions(schema, "frequensisa")).isEqualTo(2);
			assertThat(countSeededNullDetailedDescriptions(schema, "summercamp")).isEqualTo(2);
			assertThat(countSeededNullDetailedDescriptions(schema, "bot-discord-ir")).isEqualTo(2);
			assertThat(countSeededSections(schema, "blaze4")).isEqualTo(4);
			assertThat(countSeededSectionTranslations(schema, "blaze4")).isEqualTo(8);
			assertThat(countSeededSections(schema, "portfolio-spring-angular")).isEqualTo(4);
			assertThat(countSeededSectionTranslations(schema, "portfolio-spring-angular")).isEqualTo(8);
			assertThat(countSeededSections(schema, "frequensisa")).isZero();
			assertThat(countSeededSections(schema, "summercamp")).isZero();
			assertThat(countSeededSections(schema, "bot-discord-ir")).isZero();
			assertThat(seededSectionTitles(schema, "blaze4", "fr")).containsExactly("Contexte", "Architecture",
					"Logique métier et API", "Authentification et persistance");
			assertThat(seededSectionTitles(schema, "blaze4", "en")).containsExactly("Context", "Architecture",
					"Business logic and API", "Authentication and persistence");
			assertThat(seededSectionTitles(schema, "portfolio-spring-angular", "fr")).containsExactly("Contexte",
					"Architecture", "Projets et contenu", "SSR, SEO et accessibilité");
			assertThat(seededSectionTitles(schema, "portfolio-spring-angular", "en")).containsExactly("Context",
					"Architecture", "Projects and content", "SSR, SEO and accessibility");
			assertThat(seededTechnologySlugs(schema, "beamng-drive-beepbeep-3"))
				.containsExactly("java", "python", "sockets", "beamng-drive", "beepbeep-3");
			assertThat(seededTechnologySlugs(schema, "blaze4")).containsExactly("c-sharp", "dotnet", "aspnet-core",
					"blazor-webassembly", "entity-framework-core", "sqlite");
			assertThat(seededTechnologySlugs(schema, "portfolio-spring-angular")).containsExactly("angular",
					"typescript", "java", "spring-boot", "postgresql", "flyway", "angular-ssr", "tailwind-css",
					"daisyui", "docker-compose");
			assertThat(seededTechnologySlugs(schema, "frequensisa")).containsExactly("swift", "swiftui", "sqlite");
			assertThat(seededTechnologySlugs(schema, "summercamp")).containsExactly("kotlin", "jetpack-compose",
					"android", "room");
			assertThat(seededTechnologySlugs(schema, "bot-discord-ir")).containsExactly("node-js", "javascript",
					"discord-js", "sqlite");
		}
		finally {
			flyway.clean();
		}
	}

	@Test
	void flywayMigrationUpgradesV4SchemaAndSeedsDetailProjectsWithStructuredSections() throws SQLException {
		String schema = PostgresTestDatabase.uniqueSchemaName();
		Flyway v4Flyway = flyway(schema, "4");
		Flyway latestFlyway = flyway(schema);

		try {
			var v4Result = v4Flyway.migrate();

			assertThat(v4Result.migrationsExecuted).isEqualTo(4);
			assertThat(v4Flyway.info().current().getVersion().toString()).isEqualTo("4");
			assertThat(columnExists(schema, "projects", "presentation_mode")).isTrue();
			assertThat(countSeededBeamngRows(schema)).isEqualTo(1);
			assertThat(countSeededBlaze4Rows(schema)).isZero();
			assertThat(countSeededPortfolioRows(schema)).isZero();

			var upgradeResult = latestFlyway.migrate();

			assertThat(upgradeResult.migrationsExecuted).isEqualTo(6);
			assertThat(latestFlyway.info().current().getVersion().toString()).isEqualTo("10");
			assertThat(countPublicSeededProjects(schema)).isEqualTo(6);
			assertThat(seededPublicProjectSlugs(schema)).containsExactly("portfolio-spring-angular", "blaze4",
					"frequensisa", "summercamp", "bot-discord-ir", "beamng-drive-beepbeep-3");
			assertThat(seededProjectOrderValues(schema)).containsExactly("portfolio-spring-angular:10", "blaze4:20",
					"frequensisa:30", "summercamp:40", "bot-discord-ir:50", "beamng-drive-beepbeep-3:60");
			assertThat(countSeededBeamngRows(schema)).isEqualTo(1);
			assertThat(countSeededBlaze4Rows(schema)).isEqualTo(1);
			assertThat(countSeededPortfolioRows(schema)).isEqualTo(1);
			assertThat(countSeededCardOnlyProjectRows(schema, "frequensisa",
					"https://github.com/BaptisteWetterwald/ecole-ios-frequensisa")).isEqualTo(1);
			assertThat(countSeededCardOnlyProjectRows(schema, "summercamp",
					"https://github.com/BaptisteWetterwald/ecole-android-summercamp")).isEqualTo(1);
			assertThat(countSeededCardOnlyProjectRows(schema, "bot-discord-ir",
					"https://github.com/BaptisteWetterwald/discord-bot-ensisa-ir")).isEqualTo(1);
			assertThat(countSeededTranslations(schema, "blaze4")).isEqualTo(2);
			assertThat(countSeededLocalizedTranslations(schema, "portfolio-spring-angular")).isEqualTo(2);
			assertThat(countSeededLocalizedTranslations(schema, "frequensisa")).isEqualTo(2);
			assertThat(countSeededLocalizedTranslations(schema, "summercamp")).isEqualTo(2);
			assertThat(countSeededLocalizedTranslations(schema, "bot-discord-ir")).isEqualTo(2);
			assertThat(countSeededSections(schema, "blaze4")).isEqualTo(4);
			assertThat(countSeededSectionTranslations(schema, "blaze4")).isEqualTo(8);
			assertThat(countSeededSections(schema, "portfolio-spring-angular")).isEqualTo(4);
			assertThat(countSeededSectionTranslations(schema, "portfolio-spring-angular")).isEqualTo(8);
			assertThat(countSeededSections(schema, "frequensisa")).isZero();
			assertThat(countSeededSections(schema, "summercamp")).isZero();
			assertThat(countSeededSections(schema, "bot-discord-ir")).isZero();

			var repeatedResult = latestFlyway.migrate();

			assertThat(repeatedResult.migrationsExecuted).isZero();
			assertThat(countPublicSeededProjects(schema)).isEqualTo(6);
			assertThat(seededPublicProjectSlugs(schema)).containsExactly("portfolio-spring-angular", "blaze4",
					"frequensisa", "summercamp", "bot-discord-ir", "beamng-drive-beepbeep-3");
			assertThat(countSeededBlaze4Rows(schema)).isEqualTo(1);
			assertThat(countSeededPortfolioRows(schema)).isEqualTo(1);
			assertThat(countSeededCardOnlyProjectRows(schema, "frequensisa",
					"https://github.com/BaptisteWetterwald/ecole-ios-frequensisa")).isEqualTo(1);
			assertThat(countSeededCardOnlyProjectRows(schema, "summercamp",
					"https://github.com/BaptisteWetterwald/ecole-android-summercamp")).isEqualTo(1);
			assertThat(countSeededCardOnlyProjectRows(schema, "bot-discord-ir",
					"https://github.com/BaptisteWetterwald/discord-bot-ensisa-ir")).isEqualTo(1);
			assertThat(countSeededSections(schema, "blaze4")).isEqualTo(4);
			assertThat(countSeededSectionTranslations(schema, "blaze4")).isEqualTo(8);
			assertThat(countSeededSections(schema, "portfolio-spring-angular")).isEqualTo(4);
			assertThat(countSeededSectionTranslations(schema, "portfolio-spring-angular")).isEqualTo(8);
		}
		finally {
			latestFlyway.clean();
		}
	}

	@Test
	void flywayMigrationUpgradesV5SchemaIntoStructuredProjectDetails() throws SQLException {
		String schema = PostgresTestDatabase.uniqueSchemaName();
		Flyway v5Flyway = flyway(schema, "5");
		Flyway latestFlyway = flyway(schema);

		try {
			var v5Result = v5Flyway.migrate();

			assertThat(v5Result.migrationsExecuted).isEqualTo(5);
			assertThat(v5Flyway.info().current().getVersion().toString()).isEqualTo("5");
			assertThat(tableExists(schema, "project_sections")).isFalse();
			assertThat(countSeededBlaze4Rows(schema)).isEqualTo(1);

			var upgradeResult = latestFlyway.migrate();

			assertThat(upgradeResult.migrationsExecuted).isEqualTo(5);
			assertThat(latestFlyway.info().current().getVersion().toString()).isEqualTo("10");
			assertThat(tableExists(schema, "project_sections")).isTrue();
			assertThat(countPublicSeededProjects(schema)).isEqualTo(6);
			assertThat(seededPublicProjectSlugs(schema)).containsExactly("portfolio-spring-angular", "blaze4",
					"frequensisa", "summercamp", "bot-discord-ir", "beamng-drive-beepbeep-3");
			assertThat(seededSectionContents(schema, "blaze4", "en")).containsExactly(
					"Blaze4 is a Connect Four web application developed as part of an academic project focused on N-tier architectures. Its main architectural goal was to clearly separate business logic, data access and the user interface.",
					"The application is organized into several .NET projects: an application layer exposing an ASP.NET Core REST API, a data-access layer based on Entity Framework Core, a Blazor WebAssembly frontend, a shared DTO project and a test project.",
					"The backend handles game creation, gameplay and turn validation. Connect Four concepts are represented through dedicated domain models, while services, repositories and mappers separate business logic, persistence and API contracts.",
					"The application supports player registration and login using JWT authentication. Data is persisted in SQLite through Entity Framework Core and its migrations.");
			assertThat(countSeededPortfolioRows(schema)).isEqualTo(1);
			assertThat(seededSectionContents(schema, "portfolio-spring-angular", "en")).containsExactly(
					"Portfolio Spring Angular is the source-backed portfolio application for Baptiste Wetterwald. It presents localized professional content and real project records from a Spring Boot and PostgreSQL backend.",
					"The application is split into an Angular 22 SSR frontend and a Spring Boot backend. PostgreSQL stores project data, Flyway owns schema migrations and Docker Compose wires the local full-stack runtime.",
					"Projects are backend-managed entities with publication status, presentation mode, localized translations, ordered technologies and structured detail sections. The Angular frontend consumes compact list DTOs and richer detail DTOs through route resolvers.",
					"Localized /fr, /en and /hu routes are rendered at request time. The frontend applies localized metadata, canonical URLs, hreflang alternates and noindex handling for unavailable project detail pages while keeping semantic navigation and keyboard-accessible actions.");
			assertThat(countSeededCardOnlyProjectRows(schema, "frequensisa",
					"https://github.com/BaptisteWetterwald/ecole-ios-frequensisa")).isEqualTo(1);
			assertThat(countSeededCardOnlyProjectRows(schema, "summercamp",
					"https://github.com/BaptisteWetterwald/ecole-android-summercamp")).isEqualTo(1);
			assertThat(countSeededCardOnlyProjectRows(schema, "bot-discord-ir",
					"https://github.com/BaptisteWetterwald/discord-bot-ensisa-ir")).isEqualTo(1);
			assertThat(countSeededSections(schema, "frequensisa")).isZero();
			assertThat(countSeededSections(schema, "summercamp")).isZero();
			assertThat(countSeededSections(schema, "bot-discord-ir")).isZero();
		}
		finally {
			latestFlyway.clean();
		}
	}

	@Test
	void flywayMigrationUpgradesV7PortfolioSeedIntoCurrentPublicOrdering() throws SQLException {
		String schema = PostgresTestDatabase.uniqueSchemaName();
		Flyway v7Flyway = flyway(schema, "7");
		Flyway latestFlyway = flyway(schema);

		try {
			var v7Result = v7Flyway.migrate();

			assertThat(v7Result.migrationsExecuted).isEqualTo(7);
			assertThat(v7Flyway.info().current().getVersion().toString()).isEqualTo("7");
			assertThat(countPublicSeededProjects(schema)).isEqualTo(3);
			assertThat(seededPublicProjectSlugs(schema)).containsExactly("beamng-drive-beepbeep-3", "blaze4",
					"portfolio-spring-angular");

			var upgradeResult = latestFlyway.migrate();

			assertThat(upgradeResult.migrationsExecuted).isEqualTo(3);
			assertThat(latestFlyway.info().current().getVersion().toString()).isEqualTo("10");
			assertThat(countPublicSeededProjects(schema)).isEqualTo(6);
			assertThat(seededPublicProjectSlugs(schema)).containsExactly("portfolio-spring-angular", "blaze4",
					"frequensisa", "summercamp", "bot-discord-ir", "beamng-drive-beepbeep-3");
			assertThat(seededProjectOrderValues(schema)).containsExactly("portfolio-spring-angular:10", "blaze4:20",
					"frequensisa:30", "summercamp:40", "bot-discord-ir:50", "beamng-drive-beepbeep-3:60");
			assertThat(countSeededCardOnlyProjectRows(schema, "frequensisa",
					"https://github.com/BaptisteWetterwald/ecole-ios-frequensisa")).isEqualTo(1);
			assertThat(countSeededCardOnlyProjectRows(schema, "summercamp",
					"https://github.com/BaptisteWetterwald/ecole-android-summercamp")).isEqualTo(1);
			assertThat(countSeededCardOnlyProjectRows(schema, "bot-discord-ir",
					"https://github.com/BaptisteWetterwald/discord-bot-ensisa-ir")).isEqualTo(1);
			assertThat(countSeededSections(schema, "frequensisa")).isZero();
			assertThat(countSeededSections(schema, "summercamp")).isZero();
			assertThat(countSeededSections(schema, "bot-discord-ir")).isZero();
		}
		finally {
			latestFlyway.clean();
		}
	}

	@Test
	void projectDetailSeedMigrationsCanBeReappliedWithoutDuplicatingRows() throws SQLException {
		String schema = PostgresTestDatabase.uniqueSchemaName();
		Flyway flyway = flyway(schema);

		try {
			flyway.migrate();
			reapplyMigrationScript(schema, "db/migration/V5__seed_blaze4_project.sql");
			reapplyMigrationScript(schema, "db/migration/V6__add_project_detail_sections.sql");
			reapplyMigrationScript(schema, "db/migration/V7__seed_portfolio_project.sql");
			reapplyMigrationScript(schema, "db/migration/V8__seed_card_only_projects_and_reorder.sql");

			assertThat(countPublicSeededProjects(schema)).isEqualTo(6);
			assertThat(seededPublicProjectSlugs(schema)).containsExactly("portfolio-spring-angular", "blaze4",
					"frequensisa", "summercamp", "bot-discord-ir", "beamng-drive-beepbeep-3");
			assertThat(seededProjectOrderValues(schema)).containsExactly("portfolio-spring-angular:10", "blaze4:20",
					"frequensisa:30", "summercamp:40", "bot-discord-ir:50", "beamng-drive-beepbeep-3:60");
			assertThat(countSeededBlaze4Rows(schema)).isEqualTo(1);
			assertThat(countSeededPortfolioRows(schema)).isEqualTo(1);
			assertThat(countSeededCardOnlyProjectRows(schema, "frequensisa",
					"https://github.com/BaptisteWetterwald/ecole-ios-frequensisa")).isEqualTo(1);
			assertThat(countSeededCardOnlyProjectRows(schema, "summercamp",
					"https://github.com/BaptisteWetterwald/ecole-android-summercamp")).isEqualTo(1);
			assertThat(countSeededCardOnlyProjectRows(schema, "bot-discord-ir",
					"https://github.com/BaptisteWetterwald/discord-bot-ensisa-ir")).isEqualTo(1);
			assertThat(countSeededTranslations(schema, "blaze4")).isEqualTo(2);
			assertThat(countSeededLocalizedTranslations(schema, "portfolio-spring-angular")).isEqualTo(2);
			assertThat(countSeededLocalizedTranslations(schema, "frequensisa")).isEqualTo(2);
			assertThat(countSeededLocalizedTranslations(schema, "summercamp")).isEqualTo(2);
			assertThat(countSeededLocalizedTranslations(schema, "bot-discord-ir")).isEqualTo(2);
			assertThat(countSeededNullDetailedDescriptions(schema, "portfolio-spring-angular")).isEqualTo(2);
			assertThat(countSeededNullDetailedDescriptions(schema, "frequensisa")).isEqualTo(2);
			assertThat(countSeededNullDetailedDescriptions(schema, "summercamp")).isEqualTo(2);
			assertThat(countSeededNullDetailedDescriptions(schema, "bot-discord-ir")).isEqualTo(2);
			assertThat(countSeededSections(schema, "blaze4")).isEqualTo(4);
			assertThat(countSeededSectionTranslations(schema, "blaze4")).isEqualTo(8);
			assertThat(countSeededSections(schema, "portfolio-spring-angular")).isEqualTo(4);
			assertThat(countSeededSectionTranslations(schema, "portfolio-spring-angular")).isEqualTo(8);
			assertThat(countSeededSections(schema, "frequensisa")).isZero();
			assertThat(countSeededSections(schema, "summercamp")).isZero();
			assertThat(countSeededSections(schema, "bot-discord-ir")).isZero();
			assertThat(seededTechnologySlugs(schema, "blaze4")).containsExactly("c-sharp", "dotnet", "aspnet-core",
					"blazor-webassembly", "entity-framework-core", "sqlite");
			assertThat(seededTechnologySlugs(schema, "portfolio-spring-angular")).containsExactly("angular",
					"typescript", "java", "spring-boot", "postgresql", "flyway", "angular-ssr", "tailwind-css",
					"daisyui", "docker-compose");
			assertThat(seededTechnologySlugs(schema, "frequensisa")).containsExactly("swift", "swiftui", "sqlite");
			assertThat(seededTechnologySlugs(schema, "summercamp")).containsExactly("kotlin", "jetpack-compose",
					"android", "room");
			assertThat(seededTechnologySlugs(schema, "bot-discord-ir")).containsExactly("node-js", "javascript",
					"discord-js", "sqlite");
		}
		finally {
			flyway.clean();
		}
	}

	private static Flyway flyway(String schema) {
		return Flyway.configure()
			.dataSource(PostgresTestDatabase.datasourceUrl(), PostgresTestDatabase.datasourceUsername(),
					PostgresTestDatabase.datasourcePassword())
			.locations("classpath:db/migration")
			.schemas(schema)
			.defaultSchema(schema)
			.createSchemas(true)
			.cleanDisabled(false)
			.load();
	}

	private static Flyway flyway(String schema, String target) {
		return Flyway.configure()
			.dataSource(PostgresTestDatabase.datasourceUrl(), PostgresTestDatabase.datasourceUsername(),
					PostgresTestDatabase.datasourcePassword())
			.locations("classpath:db/migration")
			.schemas(schema)
			.defaultSchema(schema)
			.createSchemas(true)
			.cleanDisabled(false)
			.target(target)
			.load();
	}

	private static void reapplyMigrationScript(String schema, String scriptPath) throws SQLException {
		try (var connection = DriverManager.getConnection(PostgresTestDatabase.datasourceUrl(),
				PostgresTestDatabase.datasourceUsername(), PostgresTestDatabase.datasourcePassword())) {
			connection.setSchema(schema);
			ScriptUtils.executeSqlScript(connection, new ClassPathResource(scriptPath));
		}
	}

	private static boolean tableExists(String schema, String tableName) throws SQLException {
		try (var connection = DriverManager.getConnection(PostgresTestDatabase.datasourceUrl(),
				PostgresTestDatabase.datasourceUsername(), PostgresTestDatabase.datasourcePassword());
				var resultSet = connection.getMetaData().getTables(null, schema, tableName, new String[] { "TABLE" })) {
			return resultSet.next();
		}
	}

	private static boolean columnExists(String schema, String tableName, String columnName) throws SQLException {
		try (var connection = DriverManager.getConnection(PostgresTestDatabase.datasourceUrl(),
				PostgresTestDatabase.datasourceUsername(), PostgresTestDatabase.datasourcePassword());
				var resultSet = connection.getMetaData().getColumns(null, schema, tableName, columnName)) {
			return resultSet.next();
		}
	}

	private static int countPublicSeededProjects(String schema) throws SQLException {
		String sql = """
				select count(*)
				from %s.projects
				where slug in (
				  'portfolio-spring-angular',
				  'blaze4',
				  'frequensisa',
				  'summercamp',
				  'bot-discord-ir',
				  'beamng-drive-beepbeep-3'
				)
				and status = 'PUBLISHED'
				""".formatted(schema);

		try (var connection = DriverManager.getConnection(PostgresTestDatabase.datasourceUrl(),
				PostgresTestDatabase.datasourceUsername(), PostgresTestDatabase.datasourcePassword());
				var statement = connection.createStatement(); var resultSet = statement.executeQuery(sql)) {
			resultSet.next();
			return resultSet.getInt(1);
		}
	}

	private static List<String> seededPublicProjectSlugs(String schema) throws SQLException {
		String sql = """
				select slug
				from %s.projects
				where slug in (
				  'portfolio-spring-angular',
				  'blaze4',
				  'frequensisa',
				  'summercamp',
				  'bot-discord-ir',
				  'beamng-drive-beepbeep-3'
				)
				and status = 'PUBLISHED'
				order by display_order asc, published_at desc, id asc
				""".formatted(schema);
		List<String> slugs = new ArrayList<>();

		try (var connection = DriverManager.getConnection(PostgresTestDatabase.datasourceUrl(),
				PostgresTestDatabase.datasourceUsername(), PostgresTestDatabase.datasourcePassword());
				var statement = connection.createStatement(); var resultSet = statement.executeQuery(sql)) {
			while (resultSet.next()) {
				slugs.add(resultSet.getString(1));
			}
		}

		return slugs;
	}

	private static List<String> seededProjectOrderValues(String schema) throws SQLException {
		String sql = """
				select slug || ':' || display_order
				from %s.projects
				where slug in (
				  'portfolio-spring-angular',
				  'blaze4',
				  'frequensisa',
				  'summercamp',
				  'bot-discord-ir',
				  'beamng-drive-beepbeep-3'
				)
				and status = 'PUBLISHED'
				order by display_order asc, published_at desc, id asc
				""".formatted(schema);
		List<String> values = new ArrayList<>();

		try (var connection = DriverManager.getConnection(PostgresTestDatabase.datasourceUrl(),
				PostgresTestDatabase.datasourceUsername(), PostgresTestDatabase.datasourcePassword());
				var statement = connection.createStatement(); var resultSet = statement.executeQuery(sql)) {
			while (resultSet.next()) {
				values.add(resultSet.getString(1));
			}
		}

		return values;
	}

	private static int countSeededBeamngRows(String schema) throws SQLException {
		String sql = """
				select count(*)
				from %s.projects
				where slug = 'beamng-drive-beepbeep-3'
				and status = 'PUBLISHED'
				and presentation_mode = 'CARD_ONLY'
				and featured is false
				and logo_media_ref is null
				and github_url is null
				and demo_url is null
				""".formatted(schema);

		try (var connection = DriverManager.getConnection(PostgresTestDatabase.datasourceUrl(),
				PostgresTestDatabase.datasourceUsername(), PostgresTestDatabase.datasourcePassword());
				var statement = connection.createStatement(); var resultSet = statement.executeQuery(sql)) {
			resultSet.next();
			return resultSet.getInt(1);
		}
	}

	private static int countSeededCardOnlyProjectRows(String schema, String slug, String githubUrl) throws SQLException {
		String sql = """
				select count(*)
				from %s.projects
				where slug = '%s'
				and status = 'PUBLISHED'
				and presentation_mode = 'CARD_ONLY'
				and featured is false
				and logo_media_ref is null
				and github_url = '%s'
				and demo_url is null
				""".formatted(schema, slug, githubUrl);

		try (var connection = DriverManager.getConnection(PostgresTestDatabase.datasourceUrl(),
				PostgresTestDatabase.datasourceUsername(), PostgresTestDatabase.datasourcePassword());
				var statement = connection.createStatement(); var resultSet = statement.executeQuery(sql)) {
			resultSet.next();
			return resultSet.getInt(1);
		}
	}

	private static int countSeededBlaze4Rows(String schema) throws SQLException {
		String sql = """
				select count(*)
				from %s.projects
				where slug = 'blaze4'
				and status = 'PUBLISHED'
				and presentation_mode = 'DETAIL'
				and featured is false
				and logo_media_ref is null
				and github_url = 'https://github.com/BaptisteWetterwald/ecole-ntiers-projet-blaze4'
				and demo_url is null
				""".formatted(schema);

		try (var connection = DriverManager.getConnection(PostgresTestDatabase.datasourceUrl(),
				PostgresTestDatabase.datasourceUsername(), PostgresTestDatabase.datasourcePassword());
				var statement = connection.createStatement(); var resultSet = statement.executeQuery(sql)) {
			resultSet.next();
			return resultSet.getInt(1);
		}
	}

	private static int countSeededPortfolioRows(String schema) throws SQLException {
		String sql = """
				select count(*)
				from %s.projects
				where slug = 'portfolio-spring-angular'
				and status = 'PUBLISHED'
				and presentation_mode = 'DETAIL'
				and featured is false
				and logo_media_ref is null
				and github_url = 'https://github.com/BaptisteWetterwald/portfolio-spring-angular'
				and demo_url is null
				""".formatted(schema);

		try (var connection = DriverManager.getConnection(PostgresTestDatabase.datasourceUrl(),
				PostgresTestDatabase.datasourceUsername(), PostgresTestDatabase.datasourcePassword());
				var statement = connection.createStatement(); var resultSet = statement.executeQuery(sql)) {
			resultSet.next();
			return resultSet.getInt(1);
		}
	}

	private static int countSeededTranslations(String schema, String slug) throws SQLException {
		String sql = """
				select count(*)
				from %s.project_translations translation
				join %s.projects project on project.id = translation.project_id
				where project.slug = '%s'
				and translation.locale in ('en', 'fr')
				and length(btrim(translation.short_description)) > 0
				and length(btrim(translation.detailed_description)) > 0
				""".formatted(schema, schema, slug);

		try (var connection = DriverManager.getConnection(PostgresTestDatabase.datasourceUrl(),
				PostgresTestDatabase.datasourceUsername(), PostgresTestDatabase.datasourcePassword());
				var statement = connection.createStatement(); var resultSet = statement.executeQuery(sql)) {
			resultSet.next();
			return resultSet.getInt(1);
		}
	}

	private static int countSeededLocalizedTranslations(String schema, String slug) throws SQLException {
		String sql = """
				select count(*)
				from %s.project_translations translation
				join %s.projects project on project.id = translation.project_id
				where project.slug = '%s'
				and translation.locale in ('en', 'fr')
				and length(btrim(translation.title)) > 0
				and length(btrim(translation.short_description)) > 0
				""".formatted(schema, schema, slug);

		try (var connection = DriverManager.getConnection(PostgresTestDatabase.datasourceUrl(),
				PostgresTestDatabase.datasourceUsername(), PostgresTestDatabase.datasourcePassword());
				var statement = connection.createStatement(); var resultSet = statement.executeQuery(sql)) {
			resultSet.next();
			return resultSet.getInt(1);
		}
	}

	private static int countSeededNullDetailedDescriptions(String schema, String slug) throws SQLException {
		String sql = """
				select count(*)
				from %s.project_translations translation
				join %s.projects project on project.id = translation.project_id
				where project.slug = '%s'
				and translation.locale in ('en', 'fr')
				and translation.detailed_description is null
				""".formatted(schema, schema, slug);

		try (var connection = DriverManager.getConnection(PostgresTestDatabase.datasourceUrl(),
				PostgresTestDatabase.datasourceUsername(), PostgresTestDatabase.datasourcePassword());
				var statement = connection.createStatement(); var resultSet = statement.executeQuery(sql)) {
			resultSet.next();
			return resultSet.getInt(1);
		}
	}

	private static int countSeededSections(String schema, String slug) throws SQLException {
		String sql = """
				select count(*)
				from %s.project_sections section
				join %s.projects project on project.id = section.project_id
				where project.slug = '%s'
				""".formatted(schema, schema, slug);

		try (var connection = DriverManager.getConnection(PostgresTestDatabase.datasourceUrl(),
				PostgresTestDatabase.datasourceUsername(), PostgresTestDatabase.datasourcePassword());
				var statement = connection.createStatement(); var resultSet = statement.executeQuery(sql)) {
			resultSet.next();
			return resultSet.getInt(1);
		}
	}

	private static int countSeededSectionTranslations(String schema, String slug) throws SQLException {
		String sql = """
				select count(*)
				from %s.project_section_translations translation
				join %s.project_sections section on section.id = translation.section_id
				join %s.projects project on project.id = section.project_id
				where project.slug = '%s'
				and translation.locale in ('en', 'fr')
				and length(btrim(translation.title)) > 0
				and length(btrim(translation.content)) > 0
				""".formatted(schema, schema, schema, slug);

		try (var connection = DriverManager.getConnection(PostgresTestDatabase.datasourceUrl(),
				PostgresTestDatabase.datasourceUsername(), PostgresTestDatabase.datasourcePassword());
				var statement = connection.createStatement(); var resultSet = statement.executeQuery(sql)) {
			resultSet.next();
			return resultSet.getInt(1);
		}
	}

	private static List<String> seededSectionTitles(String schema, String slug, String locale) throws SQLException {
		return seededSectionStrings(schema, slug, locale, "title");
	}

	private static List<String> seededSectionContents(String schema, String slug, String locale) throws SQLException {
		return seededSectionStrings(schema, slug, locale, "content");
	}

	private static List<String> seededSectionStrings(String schema, String slug, String locale, String column)
			throws SQLException {
		String sql = """
				select translation.%s
				from %s.project_section_translations translation
				join %s.project_sections section on section.id = translation.section_id
				join %s.projects project on project.id = section.project_id
				where project.slug = '%s'
				and translation.locale = '%s'
				order by section.display_order asc, section.id asc
				""".formatted(column, schema, schema, schema, slug, locale);
		List<String> values = new ArrayList<>();

		try (var connection = DriverManager.getConnection(PostgresTestDatabase.datasourceUrl(),
				PostgresTestDatabase.datasourceUsername(), PostgresTestDatabase.datasourcePassword());
				var statement = connection.createStatement(); var resultSet = statement.executeQuery(sql)) {
			while (resultSet.next()) {
				values.add(resultSet.getString(1));
			}
		}

		return values;
	}

	private static List<String> seededTechnologySlugs(String schema, String slug) throws SQLException {
		String sql = """
				select technology.slug
				from %s.projects project
				join %s.project_technologies project_technology on project_technology.project_id = project.id
				join %s.technologies technology on technology.id = project_technology.technology_id
				where project.slug = '%s'
				order by project_technology.display_order asc
				""".formatted(schema, schema, schema, slug);
		List<String> slugs = new ArrayList<>();

		try (var connection = DriverManager.getConnection(PostgresTestDatabase.datasourceUrl(),
				PostgresTestDatabase.datasourceUsername(), PostgresTestDatabase.datasourcePassword());
				var statement = connection.createStatement(); var resultSet = statement.executeQuery(sql)) {
			while (resultSet.next()) {
				slugs.add(resultSet.getString(1));
			}
		}

		return slugs;
	}

}
