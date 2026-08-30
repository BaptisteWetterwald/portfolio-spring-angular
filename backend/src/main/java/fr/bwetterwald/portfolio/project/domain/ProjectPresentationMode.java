package fr.bwetterwald.portfolio.project.domain;

public enum ProjectPresentationMode {

	CARD_ONLY,

	DETAIL;

	public boolean hasDetailPage() {
		return this == DETAIL;
	}

}
