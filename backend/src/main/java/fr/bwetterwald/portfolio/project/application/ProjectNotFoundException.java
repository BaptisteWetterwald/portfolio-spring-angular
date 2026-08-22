package fr.bwetterwald.portfolio.project.application;

public class ProjectNotFoundException extends RuntimeException {

	public ProjectNotFoundException(String slug) {
		super("Project not found: " + slug);
	}

}
