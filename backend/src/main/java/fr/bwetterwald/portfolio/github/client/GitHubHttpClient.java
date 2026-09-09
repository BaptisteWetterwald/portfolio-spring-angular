package fr.bwetterwald.portfolio.github.client;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import fr.bwetterwald.portfolio.github.config.GitHubProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
public class GitHubHttpClient implements GitHubClient, GitHubContributionClient {

	static final String API_VERSION = "2026-03-10";

	private static final URI GITHUB_API_BASE_URI = URI.create("https://api.github.com");

	private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(2);

	private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(4);

	private static final int UPSTREAM_PAGE_SIZE = 20;

	private static final int MAX_CONTRIBUTION_DAYS = 400;

	private static final String CONTRIBUTION_QUERY = """
			query PortfolioContributionCalendar($login: String!) {
			  user(login: $login) {
			    contributionsCollection {
			      contributionCalendar {
			        totalContributions
			        weeks {
			          contributionDays {
			            date
			            contributionCount
			          }
			        }
			      }
			    }
			  }
			}
			""";

	private final GitHubProperties properties;

	private final ObjectMapper objectMapper;

	private final HttpClient httpClient;

	private final URI apiBaseUri;

	private final Duration requestTimeout;

	@Autowired
	public GitHubHttpClient(GitHubProperties properties, ObjectMapper objectMapper) {
		this(properties, objectMapper,
				HttpClient.newBuilder().connectTimeout(CONNECT_TIMEOUT).followRedirects(HttpClient.Redirect.NEVER).build(),
				GITHUB_API_BASE_URI);
	}

	GitHubHttpClient(GitHubProperties properties, ObjectMapper objectMapper, HttpClient httpClient, URI apiBaseUri) {
		this(properties, objectMapper, httpClient, apiBaseUri, REQUEST_TIMEOUT);
	}

	GitHubHttpClient(GitHubProperties properties, ObjectMapper objectMapper, HttpClient httpClient, URI apiBaseUri,
			Duration requestTimeout) {
		this.properties = properties;
		this.objectMapper = objectMapper;
		this.httpClient = httpClient;
		this.apiBaseUri = apiBaseUri;
		this.requestTimeout = requestTimeout;
	}

	@Override
	public List<GitHubRepositoryData> listRepositories(String username) {
		HttpRequest.Builder requestBuilder = HttpRequest.newBuilder(repositoriesUri(username))
			.timeout(this.requestTimeout)
			.header("Accept", "application/vnd.github+json")
			.header("X-GitHub-Api-Version", API_VERSION)
			.header("User-Agent", "bwetterwald-portfolio")
			.GET();

		this.properties.token().ifPresent((token) -> requestBuilder.header("Authorization", "Bearer " + token));

		return parseRepositories(send(requestBuilder.build()));
	}

	@Override
	public GitHubContributionCalendarData getContributionCalendar(String username) {
		String token = this.properties.token()
				.orElseThrow(() -> new GitHubClientException("GitHub GraphQL authentication is not configured"));
		String requestBody;

		try {
			requestBody = this.objectMapper.writeValueAsString(Map.of(
					"query", CONTRIBUTION_QUERY,
					"variables", Map.of("login", username)));
		}
		catch (RuntimeException exception) {
			throw new GitHubClientException("GitHub GraphQL request could not be created", exception);
		}

		HttpRequest request = HttpRequest.newBuilder(this.apiBaseUri.resolve("/graphql"))
			.timeout(this.requestTimeout)
			.header("Accept", "application/vnd.github+json")
			.header("Content-Type", "application/json")
			.header("X-GitHub-Api-Version", API_VERSION)
			.header("User-Agent", "bwetterwald-portfolio")
			.header("Authorization", "Bearer " + token)
			.POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
			.build();

		return parseContributionCalendar(send(request));
	}

	private URI repositoriesUri(String username) {
		return this.apiBaseUri.resolve("/users/" + username
				+ "/repos?type=owner&sort=pushed&direction=desc&per_page=" + UPSTREAM_PAGE_SIZE);
	}

	private String send(HttpRequest request) {
		try {
			HttpResponse<String> response = this.httpClient.send(request,
					HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

			if (response.statusCode() < 200 || response.statusCode() >= 300) {
				throw new GitHubClientException("GitHub returned HTTP " + response.statusCode());
			}

			return response.body();
		}
		catch (InterruptedException exception) {
			Thread.currentThread().interrupt();
			throw new GitHubClientException("GitHub request was interrupted", exception);
		}
		catch (IOException | IllegalArgumentException exception) {
			throw new GitHubClientException("GitHub request failed", exception);
		}
	}

	private List<GitHubRepositoryData> parseRepositories(String responseBody) {
		try {
			JsonNode root = this.objectMapper.readTree(responseBody);

			if (root == null || !root.isArray()) {
				throw new GitHubClientException("GitHub response was not a repository array");
			}

			List<GitHubRepositoryData> repositories = new ArrayList<>();
			for (JsonNode repository : root) {
				if (!repository.isObject()) {
					continue;
				}

				repositories.add(new GitHubRepositoryData(text(repository, "name"), text(repository, "description"),
						text(repository, "language"), integer(repository, "stargazers_count"),
						text(repository, "pushed_at"), bool(repository, "fork"), bool(repository, "archived"),
						bool(repository, "disabled")));
			}

			return List.copyOf(repositories);
		}
		catch (GitHubClientException exception) {
			throw exception;
		}
		catch (RuntimeException exception) {
			throw new GitHubClientException("GitHub response could not be parsed", exception);
		}
	}

	private GitHubContributionCalendarData parseContributionCalendar(String responseBody) {
		try {
			JsonNode root = this.objectMapper.readTree(responseBody);
			JsonNode calendar = nested(root, "data", "user", "contributionsCollection", "contributionCalendar");
			Integer totalContributions = calendar == null ? null : integer(calendar, "totalContributions");
			JsonNode weeks = calendar == null ? null : calendar.get("weeks");

			if (totalContributions == null || totalContributions < 0 || weeks == null || !weeks.isArray()) {
				throw new GitHubClientException("GitHub contribution response was incomplete");
			}

			TreeMap<LocalDate, Integer> contributionsByDate = new TreeMap<>();
			for (JsonNode week : weeks) {
				JsonNode days = week.isObject() ? week.get("contributionDays") : null;
				if (days == null || !days.isArray()) {
					continue;
				}

				for (JsonNode day : days) {
					addContributionDay(contributionsByDate, day);
				}
			}

			if (contributionsByDate.isEmpty() || contributionsByDate.size() > MAX_CONTRIBUTION_DAYS) {
				throw new GitHubClientException("GitHub contribution response had an invalid calendar range");
			}

			List<GitHubContributionDayData> days = contributionsByDate.entrySet()
				.stream()
				.map((entry) -> new GitHubContributionDayData(entry.getKey(), entry.getValue()))
				.toList();

			return new GitHubContributionCalendarData(totalContributions, days);
		}
		catch (GitHubClientException exception) {
			throw exception;
		}
		catch (RuntimeException exception) {
			throw new GitHubClientException("GitHub contribution response could not be parsed", exception);
		}
	}

	private static void addContributionDay(Map<LocalDate, Integer> contributionsByDate, JsonNode day) {
		if (!day.isObject()) {
			return;
		}

		String dateValue = text(day, "date");
		Integer contributionCount = integer(day, "contributionCount");
		if (dateValue == null || contributionCount == null || contributionCount < 0) {
			return;
		}

		try {
			contributionsByDate.put(LocalDate.parse(dateValue), contributionCount);
		}
		catch (DateTimeParseException exception) {
			// A malformed day is ignored while valid calendar days remain useful.
		}
	}

	private static JsonNode nested(JsonNode root, String... fieldNames) {
		JsonNode current = root;

		for (String fieldName : fieldNames) {
			if (current == null || !current.isObject()) {
				return null;
			}
			current = current.get(fieldName);
		}

		return current;
	}

	private static String text(JsonNode node, String fieldName) {
		JsonNode value = node.get(fieldName);

		return value != null && value.isString() ? value.stringValue() : null;
	}

	private static Integer integer(JsonNode node, String fieldName) {
		JsonNode value = node.get(fieldName);

		return value != null && value.isInt() ? value.intValue() : null;
	}

	private static Boolean bool(JsonNode node, String fieldName) {
		JsonNode value = node.get(fieldName);

		return value != null && value.isBoolean() ? value.booleanValue() : null;
	}

}
