package fr.bwetterwald.portfolio.support;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

class PostgresSchemaIsolationContextCustomizerFactoryTests {

	private final PostgresSchemaIsolationContextCustomizerFactory factory =
			new PostgresSchemaIsolationContextCustomizerFactory();

	@Test
	void createsUniqueGeneratedSchemaForEachTestProfileClass() {
		PostgresSchemaIsolationContextCustomizer first = isolatedCustomizer(FirstTestProfileSpringTest.class);
		PostgresSchemaIsolationContextCustomizer second = isolatedCustomizer(SecondTestProfileSpringTest.class);

		try {
			assertThat(first.schema()).startsWith(PostgresTestDatabase.SCHEMA_PREFIX).isNotEqualTo("public");
			assertThat(second.schema()).startsWith(PostgresTestDatabase.SCHEMA_PREFIX).isNotEqualTo("public");
			assertThat(first.schema()).isNotEqualTo(second.schema());
			assertThat(first).isNotEqualTo(second);
		}
		finally {
			PostgresTestDatabase.removeGeneratedSchemas(FirstTestProfileSpringTest.class);
			PostgresTestDatabase.removeGeneratedSchemas(SecondTestProfileSpringTest.class);
		}
	}

	@Test
	void ignoresSpringTestsWithoutTestProfile() {
		assertThat(this.factory.createContextCustomizer(WithoutTestProfileSpringTest.class, List.of())).isNull();
	}

	private PostgresSchemaIsolationContextCustomizer isolatedCustomizer(Class<?> testClass) {
		return (PostgresSchemaIsolationContextCustomizer) this.factory.createContextCustomizer(testClass, List.of());
	}

	@ActiveProfiles("test")
	private static final class FirstTestProfileSpringTest {
	}

	@ActiveProfiles("test")
	private static final class SecondTestProfileSpringTest {
	}

	private static final class WithoutTestProfileSpringTest {
	}

}
