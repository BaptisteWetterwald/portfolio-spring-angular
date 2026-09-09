package fr.bwetterwald.portfolio.github.api;

import java.time.LocalDate;
import java.util.List;

import fr.bwetterwald.portfolio.github.application.GitHubActivityService;
import fr.bwetterwald.portfolio.github.client.GitHubClient;
import fr.bwetterwald.portfolio.github.client.GitHubContributionCalendarData;
import fr.bwetterwald.portfolio.github.client.GitHubContributionDayData;
import fr.bwetterwald.portfolio.github.client.GitHubRepositoryData;
import fr.bwetterwald.portfolio.github.config.GitHubProperties;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GitHubActivityControllerTests {

	@Test
	void endpointReturnsTheControlledUnavailableContractWhenIntegrationIsDisabled() throws Exception {
		MockMvc mockMvc = mockMvc((username) -> List.of(), new GitHubProperties());

		mockMvc.perform(get("/api/v1/github/activity"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.available").value(false))
			.andExpect(jsonPath("$.profileUrl").value((Object) null))
			.andExpect(jsonPath("$.repositories").isEmpty())
			.andExpect(jsonPath("$.contributionCalendar").value((Object) null))
			.andExpect(jsonPath("$.lastRefreshedAt").value((Object) null))
			.andExpect(jsonPath("$.stale").value(false));
	}

	@Test
	void endpointReturnsOnlyThePortfolioOwnedAvailableContractAndIgnoresArbitraryTargets() throws Exception {
		GitHubProperties properties = new GitHubProperties();
		properties.setUsername("octocat");
		GitHubClient client = (username) -> List.of(new GitHubRepositoryData("portfolio", "Description", "Java",
				2, "2026-09-01T10:00:00Z", false, false, false));

		mockMvc(client, properties).perform(get("/api/v1/github/activity")
				.queryParam("username", "attacker")
				.queryParam("url", "https://example.test/private"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.available").value(true))
			.andExpect(jsonPath("$.profileUrl").value("https://github.com/octocat"))
			.andExpect(jsonPath("$.repositories[0].name").value("portfolio"))
			.andExpect(jsonPath("$.repositories[0].url").value("https://github.com/octocat/portfolio"))
			.andExpect(jsonPath("$.repositories[0].description").value("Description"))
			.andExpect(jsonPath("$.repositories[0].primaryLanguage").value("Java"))
			.andExpect(jsonPath("$.repositories[0].stars").value(2))
			.andExpect(jsonPath("$.repositories[0].lastActivityAt").value("2026-09-01T10:00:00Z"))
			.andExpect(jsonPath("$.contributionCalendar").value((Object) null))
			.andExpect(jsonPath("$.repositories[0].fork").doesNotExist())
			.andExpect(jsonPath("$.token").doesNotExist());
	}

	@Test
	void endpointExtendsTheOwnedContractWithACompactContributionCalendar() throws Exception {
		GitHubProperties properties = new GitHubProperties();
		properties.setUsername("BaptisteWetterwald");
		properties.setToken("test-token-value");
		GitHubActivityService service = new GitHubActivityService((username) -> List.of(),
				(username) -> new GitHubContributionCalendarData(5, List.of(
						new GitHubContributionDayData(LocalDate.parse("2026-09-07"), 0),
						new GitHubContributionDayData(LocalDate.parse("2026-09-08"), 5))), properties);
		MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new GitHubActivityController(service)).build();

		mockMvc.perform(get("/api/v1/github/activity"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.available").value(true))
			.andExpect(jsonPath("$.profileUrl").value("https://github.com/BaptisteWetterwald"))
			.andExpect(jsonPath("$.repositories").isEmpty())
			.andExpect(jsonPath("$.contributionCalendar.totalContributions").value(5))
			.andExpect(jsonPath("$.contributionCalendar.startsOn").value("2026-09-07"))
			.andExpect(jsonPath("$.contributionCalendar.endsOn").value("2026-09-08"))
			.andExpect(jsonPath("$.contributionCalendar.days[0].contributionCount").value(0))
			.andExpect(jsonPath("$.contributionCalendar.days[1].contributionCount").value(5))
			.andExpect(jsonPath("$.contributionCalendar.days[1].color").doesNotExist());
	}

	private static MockMvc mockMvc(GitHubClient client, GitHubProperties properties) {
		GitHubActivityService service = new GitHubActivityService(client,
				(username) -> {
					throw new AssertionError("Contribution client must not run without a token");
				}, properties);

		return MockMvcBuilders.standaloneSetup(new GitHubActivityController(service)).build();
	}

}
