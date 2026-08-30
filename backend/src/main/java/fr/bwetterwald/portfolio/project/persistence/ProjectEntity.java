package fr.bwetterwald.portfolio.project.persistence;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import fr.bwetterwald.portfolio.common.persistence.TimestampedEntity;
import fr.bwetterwald.portfolio.project.domain.ProjectLocale;
import fr.bwetterwald.portfolio.project.domain.ProjectPresentationMode;
import fr.bwetterwald.portfolio.project.domain.ProjectStatus;
import fr.bwetterwald.portfolio.technology.persistence.TechnologyEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

@Entity
@Table(name = "projects")
public class ProjectEntity extends TimestampedEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "slug", nullable = false, length = 120, unique = true)
	private String slug;

	@Column(name = "logo_media_ref", length = 500)
	private String logoMediaRef;

	@Column(name = "github_url", length = 500)
	private String githubUrl;

	@Column(name = "demo_url", length = 500)
	private String demoUrl;

	@Column(name = "featured", nullable = false)
	private boolean featured;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 32)
	private ProjectStatus status = ProjectStatus.DRAFT;

	@Enumerated(EnumType.STRING)
	@Column(name = "presentation_mode", nullable = false, length = 32)
	private ProjectPresentationMode presentationMode = ProjectPresentationMode.DETAIL;

	@Column(name = "display_order", nullable = false)
	private int displayOrder;

	@Column(name = "published_at")
	private Instant publishedAt;

	@OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
	private Set<ProjectTranslationEntity> translations = new LinkedHashSet<>();

	@OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("displayOrder ASC")
	private List<ProjectTechnologyEntity> projectTechnologies = new ArrayList<>();

	@OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("displayOrder ASC")
	private List<ProjectSectionEntity> sections = new ArrayList<>();

	protected ProjectEntity() {
	}

	public ProjectEntity(String slug, ProjectStatus status, ProjectPresentationMode presentationMode, int displayOrder) {
		this.slug = slug;
		this.status = status;
		this.presentationMode = presentationMode;
		this.displayOrder = displayOrder;
	}

	public Long getId() {
		return this.id;
	}

	public String getSlug() {
		return this.slug;
	}

	public void setSlug(String slug) {
		this.slug = slug;
	}

	public String getLogoMediaRef() {
		return this.logoMediaRef;
	}

	public void setLogoMediaRef(String logoMediaRef) {
		this.logoMediaRef = logoMediaRef;
	}

	public String getGithubUrl() {
		return this.githubUrl;
	}

	public void setGithubUrl(String githubUrl) {
		this.githubUrl = githubUrl;
	}

	public String getDemoUrl() {
		return this.demoUrl;
	}

	public void setDemoUrl(String demoUrl) {
		this.demoUrl = demoUrl;
	}

	public boolean isFeatured() {
		return this.featured;
	}

	public void setFeatured(boolean featured) {
		this.featured = featured;
	}

	public ProjectStatus getStatus() {
		return this.status;
	}

	public void setStatus(ProjectStatus status) {
		this.status = status;
	}

	public ProjectPresentationMode getPresentationMode() {
		return this.presentationMode;
	}

	public void setPresentationMode(ProjectPresentationMode presentationMode) {
		this.presentationMode = presentationMode;
	}

	public int getDisplayOrder() {
		return this.displayOrder;
	}

	public void setDisplayOrder(int displayOrder) {
		this.displayOrder = displayOrder;
	}

	public Instant getPublishedAt() {
		return this.publishedAt;
	}

	public void setPublishedAt(Instant publishedAt) {
		this.publishedAt = publishedAt;
	}

	public Set<ProjectTranslationEntity> getTranslations() {
		return Collections.unmodifiableSet(this.translations);
	}

	public List<ProjectTechnologyEntity> getProjectTechnologies() {
		return Collections.unmodifiableList(this.projectTechnologies);
	}

	public List<ProjectSectionEntity> getSections() {
		return Collections.unmodifiableList(this.sections);
	}

	public ProjectTranslationEntity addTranslation(ProjectLocale locale, String title, String shortDescription,
			String detailedDescription) {
		ProjectTranslationEntity translation = new ProjectTranslationEntity(this, locale, title, shortDescription,
				detailedDescription);
		this.translations.add(translation);
		return translation;
	}

	public ProjectTechnologyEntity addTechnology(TechnologyEntity technology, int displayOrder) {
		ProjectTechnologyEntity projectTechnology = new ProjectTechnologyEntity(this, technology, displayOrder);
		this.projectTechnologies.add(projectTechnology);
		return projectTechnology;
	}

	public ProjectSectionEntity addSection(int displayOrder) {
		ProjectSectionEntity section = new ProjectSectionEntity(this, displayOrder);
		this.sections.add(section);
		return section;
	}

}
