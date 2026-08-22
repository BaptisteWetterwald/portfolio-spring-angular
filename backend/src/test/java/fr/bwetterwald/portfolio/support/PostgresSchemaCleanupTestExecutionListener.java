package fr.bwetterwald.portfolio.support;

import java.sql.SQLException;

import org.springframework.test.annotation.DirtiesContext.HierarchyMode;
import org.springframework.test.context.TestContext;
import org.springframework.test.context.TestExecutionListener;

public class PostgresSchemaCleanupTestExecutionListener implements TestExecutionListener {

	@Override
	public void afterTestClass(TestContext testContext) throws SQLException {
		for (String schema : PostgresTestDatabase.removeGeneratedSchemas(testContext.getTestClass())) {
			PostgresTestDatabase.dropSchema(schema);
		}
		if (testContext.hasApplicationContext()) {
			testContext.markApplicationContextDirty(HierarchyMode.EXHAUSTIVE);
		}
	}

}
