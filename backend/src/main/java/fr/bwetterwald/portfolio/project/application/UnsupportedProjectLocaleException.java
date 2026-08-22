package fr.bwetterwald.portfolio.project.application;

public class UnsupportedProjectLocaleException extends RuntimeException {

	public UnsupportedProjectLocaleException(String locale) {
		super("Unsupported project locale: " + locale);
	}

}
