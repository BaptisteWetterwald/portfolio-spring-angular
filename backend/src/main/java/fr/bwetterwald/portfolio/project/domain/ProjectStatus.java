package fr.bwetterwald.portfolio.project.domain;

import java.util.EnumSet;
import java.util.Set;

public enum ProjectStatus {

	DRAFT,

	PUBLISHED,

	ARCHIVED;

	public boolean isPubliclyVisible() {
		return this == PUBLISHED || this == ARCHIVED;
	}

	public static Set<ProjectStatus> publicStatuses() {
		return EnumSet.of(PUBLISHED, ARCHIVED);
	}

}
