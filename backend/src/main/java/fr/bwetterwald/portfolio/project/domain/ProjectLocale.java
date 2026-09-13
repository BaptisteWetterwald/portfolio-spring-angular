package fr.bwetterwald.portfolio.project.domain;

import java.util.Arrays;

public enum ProjectLocale {

	FR("fr"),

	EN("en"),

	HU("hu");

	private final String code;

	ProjectLocale(String code) {
		this.code = code;
	}

	public String getCode() {
		return this.code;
	}

	public static ProjectLocale fromCode(String code) {
		return Arrays.stream(values())
			.filter((locale) -> locale.code.equals(code))
			.findFirst()
			.orElseThrow(() -> new IllegalArgumentException("Unsupported project locale: " + code));
	}

}
