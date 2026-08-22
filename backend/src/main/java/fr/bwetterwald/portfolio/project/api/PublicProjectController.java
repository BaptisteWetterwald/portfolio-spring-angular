package fr.bwetterwald.portfolio.project.api;

import java.util.List;

import fr.bwetterwald.portfolio.project.application.PublicProjectService;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/projects", produces = MediaType.APPLICATION_JSON_VALUE)
@Validated
public class PublicProjectController {

	private static final String SLUG_PATTERN = "^[a-z0-9]+(-[a-z0-9]+)*$";

	private final PublicProjectService publicProjectService;

	public PublicProjectController(PublicProjectService publicProjectService) {
		this.publicProjectService = publicProjectService;
	}

	@GetMapping
	public List<ProjectSummaryDto> listProjects(@RequestParam String locale,
			@RequestParam(required = false) String status) {
		return this.publicProjectService.listProjects(locale, status);
	}

	@GetMapping("/featured")
	public List<ProjectSummaryDto> listFeaturedProjects(@RequestParam String locale) {
		return this.publicProjectService.listFeaturedProjects(locale);
	}

	@GetMapping("/{slug}")
	public ProjectDetailDto getProject(@PathVariable @Pattern(regexp = SLUG_PATTERN) String slug,
			@RequestParam String locale) {
		return this.publicProjectService.getProject(slug, locale);
	}

}
