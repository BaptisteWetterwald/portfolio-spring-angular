package fr.bwetterwald.portfolio.project.application;

public class UnsupportedPublicProjectStatusException extends RuntimeException {

	public UnsupportedPublicProjectStatusException(String status) {
		super("Unsupported public project status filter: " + status);
	}

}
