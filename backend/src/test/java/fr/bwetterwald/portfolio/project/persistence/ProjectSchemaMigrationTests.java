package fr.bwetterwald.portfolio.project.persistence;

import java.sql.DriverManager;
import java.sql.SQLException;

import fr.bwetterwald.portfolio.support.PostgresTestDatabase;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ProjectSchemaMigrationTests {

	@Test
	void flywayMigrationAppliesFromEmptyPostgresSchema() throws SQLException {
		String schema = PostgresTestDatabase.uniqueSchemaName();
		Flyway flyway = Flyway.configure()
			.dataSource(PostgresTestDatabase.datasourceUrl(), PostgresTestDatabase.datasourceUsername(),
					PostgresTestDatabase.datasourcePassword())
			.locations("classpath:db/migration")
			.schemas(schema)
			.defaultSchema(schema)
			.createSchemas(true)
			.cleanDisabled(false)
			.load();

		try {
			var result = flyway.migrate();

			assertThat(result.migrationsExecuted).isEqualTo(1);
			assertThat(flyway.info().current().getVersion().toString()).isEqualTo("1");
			assertThat(tableExists(schema, "projects")).isTrue();
			assertThat(tableExists(schema, "project_translations")).isTrue();
			assertThat(tableExists(schema, "technologies")).isTrue();
			assertThat(tableExists(schema, "project_technologies")).isTrue();
		}
		finally {
			flyway.clean();
		}
	}

	private static boolean tableExists(String schema, String tableName) throws SQLException {
		try (var connection = DriverManager.getConnection(PostgresTestDatabase.datasourceUrl(),
				PostgresTestDatabase.datasourceUsername(), PostgresTestDatabase.datasourcePassword());
				var resultSet = connection.getMetaData().getTables(null, schema, tableName, new String[] { "TABLE" })) {
			return resultSet.next();
		}
	}

}
