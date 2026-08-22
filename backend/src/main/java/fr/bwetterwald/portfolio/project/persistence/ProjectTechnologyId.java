package fr.bwetterwald.portfolio.project.persistence;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class ProjectTechnologyId implements Serializable {

	@Column(name = "project_id")
	private Long projectId;

	@Column(name = "technology_id")
	private Long technologyId;

	protected ProjectTechnologyId() {
	}

	public ProjectTechnologyId(Long projectId, Long technologyId) {
		this.projectId = projectId;
		this.technologyId = technologyId;
	}

	public Long getProjectId() {
		return this.projectId;
	}

	public Long getTechnologyId() {
		return this.technologyId;
	}

	@Override
	public boolean equals(Object other) {
		if (this == other) {
			return true;
		}
		if (!(other instanceof ProjectTechnologyId that)) {
			return false;
		}
		return Objects.equals(this.projectId, that.projectId) && Objects.equals(this.technologyId, that.technologyId);
	}

	@Override
	public int hashCode() {
		return Objects.hash(this.projectId, this.technologyId);
	}

}
