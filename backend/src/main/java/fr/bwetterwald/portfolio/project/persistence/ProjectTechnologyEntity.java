package fr.bwetterwald.portfolio.project.persistence;

import fr.bwetterwald.portfolio.technology.persistence.TechnologyEntity;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

@Entity
@Table(name = "project_technologies")
public class ProjectTechnologyEntity {

	@EmbeddedId
	private ProjectTechnologyId id = new ProjectTechnologyId();

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@MapsId("projectId")
	@JoinColumn(name = "project_id", nullable = false)
	private ProjectEntity project;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@MapsId("technologyId")
	@JoinColumn(name = "technology_id", nullable = false)
	private TechnologyEntity technology;

	@Column(name = "display_order", nullable = false)
	private int displayOrder;

	protected ProjectTechnologyEntity() {
	}

	ProjectTechnologyEntity(ProjectEntity project, TechnologyEntity technology, int displayOrder) {
		this.project = project;
		this.technology = technology;
		this.displayOrder = displayOrder;
	}

	public ProjectTechnologyId getId() {
		return this.id;
	}

	public ProjectEntity getProject() {
		return this.project;
	}

	public TechnologyEntity getTechnology() {
		return this.technology;
	}

	public int getDisplayOrder() {
		return this.displayOrder;
	}

	public void setDisplayOrder(int displayOrder) {
		this.displayOrder = displayOrder;
	}

}
