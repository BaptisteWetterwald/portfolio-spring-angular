package fr.bwetterwald.portfolio.project.persistence;

import fr.bwetterwald.portfolio.project.domain.ProjectLocale;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ProjectLocaleConverter implements AttributeConverter<ProjectLocale, String> {

	@Override
	public String convertToDatabaseColumn(ProjectLocale attribute) {
		return (attribute != null) ? attribute.getCode() : null;
	}

	@Override
	public ProjectLocale convertToEntityAttribute(String dbData) {
		return (dbData != null) ? ProjectLocale.fromCode(dbData) : null;
	}

}
