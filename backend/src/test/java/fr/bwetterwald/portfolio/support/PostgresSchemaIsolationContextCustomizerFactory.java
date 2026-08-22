package fr.bwetterwald.portfolio.support;

import java.util.Arrays;
import java.util.List;

import org.springframework.core.annotation.MergedAnnotation;
import org.springframework.core.annotation.MergedAnnotations;
import org.springframework.core.annotation.MergedAnnotations.SearchStrategy;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfigurationAttributes;
import org.springframework.test.context.ContextCustomizer;
import org.springframework.test.context.ContextCustomizerFactory;

public class PostgresSchemaIsolationContextCustomizerFactory implements ContextCustomizerFactory {

	@Override
	public ContextCustomizer createContextCustomizer(Class<?> testClass,
			List<ContextConfigurationAttributes> configAttributes) {
		if (!usesTestProfile(testClass)) {
			return null;
		}
		return new PostgresSchemaIsolationContextCustomizer(testClass, PostgresTestDatabase.uniqueSchemaName());
	}

	private static boolean usesTestProfile(Class<?> testClass) {
		MergedAnnotation<ActiveProfiles> annotation = MergedAnnotations
			.from(testClass, SearchStrategy.TYPE_HIERARCHY)
			.get(ActiveProfiles.class);
		return annotation.isPresent() && Arrays.asList(annotation.synthesize().profiles()).contains("test");
	}

}
