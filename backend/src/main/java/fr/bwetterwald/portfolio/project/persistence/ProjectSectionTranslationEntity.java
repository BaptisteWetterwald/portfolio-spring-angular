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
@Table(name = "project_section_translations")
public class ProjectSectionTranslationEntity extends TimestampedEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "section_id", nullable = false)
	private ProjectSectionEntity section;

	@Convert(converter = ProjectLocaleConverter.class)
	@Column(name = "locale", nullable = false, length = 8)
	private ProjectLocale locale;

	@Column(name = "title", nullable = false, length = 180)
	private String title;

	@Column(name = "content", nullable = false)
	private String content;

	protected ProjectSectionTranslationEntity() {
	}

	ProjectSectionTranslationEntity(ProjectSectionEntity section, ProjectLocale locale, String title, String content) {
		this.section = section;
		this.locale = locale;
		this.title = title;
		this.content = content;
	}

	public Long getId() {
		return this.id;
	}

	public ProjectSectionEntity getSection() {
		return this.section;
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

	public String getContent() {
		return this.content;
	}

	public void setContent(String content) {
		this.content = content;
	}

}
