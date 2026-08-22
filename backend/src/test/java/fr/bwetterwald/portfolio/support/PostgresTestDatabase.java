package fr.bwetterwald.portfolio.support;

import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.UUID;

import org.springframework.core.env.Environment;

public final class PostgresTestDatabase {

	public static final String SCHEMA_PROPERTY = "portfolio.test.postgres.schema";

	public static final String SCHEMA_PREFIX = "portfolio_test_";

	private static final Map<Class<?>, Set<String>> GENERATED_SCHEMAS = new ConcurrentHashMap<>();

	private PostgresTestDatabase() {
	}

	public static String uniqueSchemaName() {
		String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 12).toLowerCase(Locale.ROOT);
		return SCHEMA_PREFIX + suffix;
	}

	public static void registerGeneratedSchema(Class<?> testClass, String schema) {
		validateGeneratedSchema(schema);
		GENERATED_SCHEMAS.computeIfAbsent(testClass, (ignored) -> Collections.synchronizedSet(new LinkedHashSet<>()))
			.add(schema);
	}

	public static Set<String> removeGeneratedSchemas(Class<?> testClass) {
		Set<String> schemas = GENERATED_SCHEMAS.remove(testClass);
		if (schemas == null) {
			return Set.of();
		}
		return Set.copyOf(schemas);
	}

	public static String schemaFromEnvironment(Environment environment) {
		String schema = environment.getRequiredProperty(SCHEMA_PROPERTY);
		validateGeneratedSchema(schema);
		return schema;
	}

	public static boolean isGeneratedSchemaName(String schema) {
		return schema != null && schema.matches("^" + SCHEMA_PREFIX + "[a-z0-9]+$");
	}

	public static String datasourceUrl() {
		return configuredValue("test.spring.datasource.url", "TEST_SPRING_DATASOURCE_URL",
				configuredValue("spring.datasource.url", "SPRING_DATASOURCE_URL",
						"jdbc:postgresql://localhost:5432/portfolio"));
	}

	public static String datasourceUsername() {
		return configuredValue("test.spring.datasource.username", "TEST_SPRING_DATASOURCE_USERNAME",
				configuredValue("spring.datasource.username", "SPRING_DATASOURCE_USERNAME", "portfolio"));
	}

	public static String datasourcePassword() {
		return configuredValue("test.spring.datasource.password", "TEST_SPRING_DATASOURCE_PASSWORD",
				configuredValue("spring.datasource.password", "SPRING_DATASOURCE_PASSWORD",
						"portfolio-local-password"));
	}

	public static void dropSchema(String schema) throws SQLException {
		validateGeneratedSchema(schema);
		try (var connection = DriverManager.getConnection(datasourceUrl(), datasourceUsername(), datasourcePassword());
				var statement = connection.createStatement()) {
			statement.execute("drop schema if exists " + schema + " cascade");
		}
	}

	private static String configuredValue(String systemProperty, String environmentVariable, String defaultValue) {
		String propertyValue = System.getProperty(systemProperty);
		if (hasText(propertyValue)) {
			return propertyValue;
		}
		String environmentValue = System.getenv(environmentVariable);
		if (hasText(environmentValue)) {
			return environmentValue;
		}
		return defaultValue;
	}

	private static boolean hasText(String value) {
		return value != null && !value.isBlank();
	}

	public static void validateGeneratedSchema(String schema) {
		if (!isGeneratedSchemaName(schema)) {
			throw new IllegalArgumentException("Refusing to manage unexpected PostgreSQL schema: " + schema);
		}
	}

}
