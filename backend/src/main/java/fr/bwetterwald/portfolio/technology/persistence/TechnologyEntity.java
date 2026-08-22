package fr.bwetterwald.portfolio.technology.persistence;

import fr.bwetterwald.portfolio.common.persistence.TimestampedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "technologies")
public class TechnologyEntity extends TimestampedEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "name", nullable = false, length = 120, unique = true)
	private String name;

	@Column(name = "slug", nullable = false, length = 120, unique = true)
	private String slug;

	@Column(name = "icon_ref", length = 500)
	private String iconRef;

	@Column(name = "category", length = 80)
	private String category;

	protected TechnologyEntity() {
	}

	public TechnologyEntity(String name, String slug) {
		this.name = name;
		this.slug = slug;
	}

	public Long getId() {
		return this.id;
	}

	public String getName() {
		return this.name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getSlug() {
		return this.slug;
	}

	public void setSlug(String slug) {
		this.slug = slug;
	}

	public String getIconRef() {
		return this.iconRef;
	}

	public void setIconRef(String iconRef) {
		this.iconRef = iconRef;
	}

	public String getCategory() {
		return this.category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

}
