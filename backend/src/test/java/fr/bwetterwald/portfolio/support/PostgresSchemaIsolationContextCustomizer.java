package fr.bwetterwald.portfolio.support;

import java.util.Objects;

import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.test.context.ContextCustomizer;
import org.springframework.test.context.MergedContextConfiguration;

final class PostgresSchemaIsolationContextCustomizer implements ContextCustomizer {

	private final Class<?> testClass;

	private final String schema;

	PostgresSchemaIsolationContextCustomizer(Class<?> testClass, String schema) {
		this.testClass = testClass;
		this.schema = schema;
		PostgresTestDatabase.registerGeneratedSchema(testClass, schema);
	}

	String schema() {
		return this.schema;
	}

	@Override
	public void customizeContext(ConfigurableApplicationContext context, MergedContextConfiguration mergedConfig) {
		PostgresTestDatabase.validateGeneratedSchema(this.schema);
		TestPropertyValues.of("spring.datasource.url=" + PostgresTestDatabase.datasourceUrl(),
				"spring.datasource.username=" + PostgresTestDatabase.datasourceUsername(),
				"spring.datasource.password=" + PostgresTestDatabase.datasourcePassword(),
				"spring.flyway.enabled=true", "spring.flyway.create-schemas=true",
				"spring.flyway.schemas=" + this.schema, "spring.flyway.default-schema=" + this.schema,
				"spring.jpa.hibernate.ddl-auto=validate",
				"spring.jpa.properties.hibernate.default_schema=" + this.schema,
				PostgresTestDatabase.SCHEMA_PROPERTY + "=" + this.schema)
			.applyTo(context);
	}

	@Override
	public boolean equals(Object other) {
		if (this == other) {
			return true;
		}
		if (!(other instanceof PostgresSchemaIsolationContextCustomizer that)) {
			return false;
		}
		return Objects.equals(this.testClass, that.testClass) && Objects.equals(this.schema, that.schema);
	}

	@Override
	public int hashCode() {
		return Objects.hash(this.testClass, this.schema);
	}

}
