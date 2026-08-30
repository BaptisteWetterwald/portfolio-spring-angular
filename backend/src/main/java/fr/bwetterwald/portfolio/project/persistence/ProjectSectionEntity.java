package fr.bwetterwald.portfolio.project.persistence;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

import fr.bwetterwald.portfolio.common.persistence.TimestampedEntity;
import fr.bwetterwald.portfolio.project.domain.ProjectLocale;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "project_sections")
public class ProjectSectionEntity extends TimestampedEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "project_id", nullable = false)
	private ProjectEntity project;

	@Column(name = "display_order", nullable = false)
	private int displayOrder;

	@OneToMany(mappedBy = "section", cascade = CascadeType.ALL, orphanRemoval = true)
	private Set<ProjectSectionTranslationEntity> translations = new LinkedHashSet<>();

	protected ProjectSectionEntity() {
	}

	ProjectSectionEntity(ProjectEntity project, int displayOrder) {
		this.project = project;
		this.displayOrder = displayOrder;
	}

	public Long getId() {
		return this.id;
	}

	public ProjectEntity getProject() {
		return this.project;
	}

	public int getDisplayOrder() {
		return this.displayOrder;
	}

	public void setDisplayOrder(int displayOrder) {
		this.displayOrder = displayOrder;
	}

	public Set<ProjectSectionTranslationEntity> getTranslations() {
		return Collections.unmodifiableSet(this.translations);
	}

	public ProjectSectionTranslationEntity addTranslation(ProjectLocale locale, String title, String content) {
		ProjectSectionTranslationEntity translation = new ProjectSectionTranslationEntity(this, locale, title, content);
		this.translations.add(translation);
		return translation;
	}

}
