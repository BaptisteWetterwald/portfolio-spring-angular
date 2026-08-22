package fr.bwetterwald.portfolio.project.persistence;

import fr.bwetterwald.portfolio.common.persistence.TimestampedEntity;
import fr.bwetterwald.portfolio.project.domain.ProjectLocale;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "project_translations")
public class ProjectTranslationEntity extends TimestampedEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "project_id", nullable = false)
	private ProjectEntity project;

	@Convert(converter = ProjectLocaleConverter.class)
	@Column(name = "locale", nullable = false, length = 8)
	private ProjectLocale locale;

	@Column(name = "title", nullable = false, length = 180)
	private String title;

	@Column(name = "short_description", nullable = false, length = 320)
	private String shortDescription;

	@Column(name = "detailed_description")
	private String detailedDescription;

	protected ProjectTranslationEntity() {
	}

	ProjectTranslationEntity(ProjectEntity project, ProjectLocale locale, String title, String shortDescription,
			String detailedDescription) {
		this.project = project;
		this.locale = locale;
		this.title = title;
		this.shortDescription = shortDescription;
		this.detailedDescription = detailedDescription;
	}

	public Long getId() {
		return this.id;
	}

	public ProjectEntity getProject() {
		return this.project;
	}

	public ProjectLocale getLocale() {
		return this.locale;
	}

	public void setLocale(ProjectLocale locale) {
		this.locale = locale;
	}

	public String getTitle() {
		return this.title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getShortDescription() {
		return this.shortDescription;
	}

	public void setShortDescription(String shortDescription) {
		this.shortDescription = shortDescription;
	}

	public String getDetailedDescription() {
		return this.detailedDescription;
	}

	public void setDetailedDescription(String detailedDescription) {
		this.detailedDescription = detailedDescription;
	}

}
