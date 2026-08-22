package fr.bwetterwald.portfolio.support;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;

@ActiveProfiles("test")
public abstract class AbstractPostgresSpringTest {

	@Autowired
	private Environment environment;

	protected String isolatedPostgresSchema() {
		return PostgresTestDatabase.schemaFromEnvironment(this.environment);
	}

}
