package fr.bwetterwald.portfolio.github.api;

import fr.bwetterwald.portfolio.github.application.GitHubActivityService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/github", produces = MediaType.APPLICATION_JSON_VALUE)
public class GitHubActivityController {

	private final GitHubActivityService gitHubActivityService;

	public GitHubActivityController(GitHubActivityService gitHubActivityService) {
		this.gitHubActivityService = gitHubActivityService;
	}

	@GetMapping("/activity")
	public GitHubActivityDto getActivity() {
		return this.gitHubActivityService.getActivity();
	}

}
