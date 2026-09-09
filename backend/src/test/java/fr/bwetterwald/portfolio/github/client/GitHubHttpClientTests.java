package fr.bwetterwald.portfolio.github.client;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import fr.bwetterwald.portfolio.github.config.GitHubProperties;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GitHubHttpClientTests {

	private HttpServer server;

	private URI baseUri;

	private final AtomicReference<String> authorization = new AtomicReference<>();

	private final AtomicReference<String> requestTarget = new AtomicReference<>();

	private final AtomicReference<String> requestMethod = new AtomicReference<>();

	private final AtomicReference<String> requestBody = new AtomicReference<>();

	private int responseStatus;

	private String responseBody;

	private Duration responseDelay;

	@BeforeEach
	void startServer() throws IOException {
		this.responseStatus = 200;
		this.responseBody = "[]";
		this.responseDelay = Duration.ZERO;
		this.server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		this.server.createContext("/", this::handleRequest);
		this.server.start();
		this.baseUri = URI.create("http://127.0.0.1:" + this.server.getAddress().getPort());
	}

	@AfterEach
	void stopServer() {
		this.server.stop(0);
	}

	@Test
	void anonymousRequestUsesTheBoundedPublicRepositoryEndpointAndMapsRequiredFields() {
		this.responseBody = """
				[
				  {
				    "name": "portfolio",
				    "description": "A portfolio",
				    "language": "Java",
				    "stargazers_count": 4,
				    "pushed_at": "2026-08-01T12:00:00Z",
				    "fork": false,
				    "archived": false,
				    "disabled": false,
				    "ignored_field": "not mapped"
				  }
				]
				""";

		List<GitHubRepositoryData> repositories = client(properties(null)).listRepositories("octocat");

		assertThat(repositories).containsExactly(new GitHubRepositoryData("portfolio", "A portfolio", "Java", 4,
				"2026-08-01T12:00:00Z", false, false, false));
		assertThat(this.authorization.get()).isNull();
		assertThat(this.requestTarget.get())
				.isEqualTo("/users/octocat/repos?type=owner&sort=pushed&direction=desc&per_page=20");
	}

	@Test
	void optionalTokenUsesABearerHeaderWithoutAppearingInTheClientDescription() {
		GitHubProperties properties = properties("test-token-value");

		client(properties).listRepositories("octocat");

		assertThat(this.authorization.get()).isEqualTo("Bearer test-token-value");
		assertThat(properties.toString()).doesNotContain("test-token-value");
	}

	@Test
	void contributionCalendarUsesAuthenticatedGraphQlAndMapsOnlyCountsAndDates() {
		this.responseBody = """
				{
				  "data": {
				    "user": {
				      "contributionsCollection": {
				        "contributionCalendar": {
				          "totalContributions": 12,
				          "weeks": [
				            {"contributionDays": [
				              {"date": "2026-09-06", "contributionCount": 0, "color": "ignored"},
				              {"date": "2026-09-07", "contributionCount": 12}
				            ]}
				          ]
				        }
				      }
				    }
				  }
				}
				""";

		GitHubContributionCalendarData calendar = client(properties("test-token-value"))
				.getContributionCalendar("BaptisteWetterwald");

		assertThat(calendar.totalContributions()).isEqualTo(12);
		assertThat(calendar.days()).containsExactly(
				new GitHubContributionDayData(java.time.LocalDate.parse("2026-09-06"), 0),
				new GitHubContributionDayData(java.time.LocalDate.parse("2026-09-07"), 12));
		assertThat(this.requestMethod.get()).isEqualTo("POST");
		assertThat(this.requestTarget.get()).isEqualTo("/graphql");
		assertThat(this.authorization.get()).isEqualTo("Bearer test-token-value");
		assertThat(this.requestBody.get()).contains("PortfolioContributionCalendar", "BaptisteWetterwald")
				.doesNotContain("test-token-value");
	}

	@Test
	void missingTokenPreventsGraphQlRequestWithoutAffectingAnonymousRestSupport() {
		GitHubHttpClient client = client(properties(null));

		assertThatThrownBy(() -> client.getContributionCalendar("BaptisteWetterwald"))
				.isInstanceOf(GitHubClientException.class)
				.hasMessage("GitHub GraphQL authentication is not configured");
		assertThat(this.requestTarget.get()).isNull();
	}

	@Test
	void validGraphQlDataSurvivesErrorsAndMalformedPartialDays() {
		this.responseBody = """
				{
				  "data": {"user": {"contributionsCollection": {"contributionCalendar": {
				    "totalContributions": 4,
				    "weeks": [{"contributionDays": [
				      {"date": "2026-09-07", "contributionCount": 4},
				      {"date": "not-a-date", "contributionCount": 10},
				      {"date": "2026-09-08", "contributionCount": -1},
				      "unexpected-day"
				    ]}]
				  }}}},
				  "errors": [{"message": "A non-calendar field was unavailable"}]
				}
				""";

		GitHubContributionCalendarData calendar = client(properties("test-token-value"))
				.getContributionCalendar("BaptisteWetterwald");

		assertThat(calendar.totalContributions()).isEqualTo(4);
		assertThat(calendar.days()).containsExactly(
				new GitHubContributionDayData(java.time.LocalDate.parse("2026-09-07"), 4));
	}

	@Test
	void graphQlErrorsWithoutUsableDataBecomeControlledExceptionsWithoutCredentialLeakage() {
		this.responseBody = """
				{"data":{"user":null},"errors":[{"message":"test-token-value upstream details"}]}
				""";

		assertThatThrownBy(() -> client(properties("test-token-value"))
				.getContributionCalendar("BaptisteWetterwald"))
				.isInstanceOf(GitHubClientException.class)
				.hasMessage("GitHub contribution response was incomplete")
				.hasMessageNotContaining("test-token-value")
				.hasMessageNotContaining("upstream details");
	}

	@Test
	void errorResponseBecomesAControlledClientExceptionWithoutResponseOrTokenLeakage() {
		this.responseStatus = 429;
		this.responseBody = "test-token-value upstream details";

		assertThatThrownBy(() -> client(properties("test-token-value")).listRepositories("octocat"))
				.isInstanceOf(GitHubClientException.class)
				.hasMessage("GitHub returned HTTP 429")
				.hasMessageNotContaining("secret-value")
				.hasMessageNotContaining("upstream details");
	}

	@Test
	void malformedResponseBecomesAControlledClientException() {
		this.responseBody = "{not-json";

		assertThatThrownBy(() -> client(properties(null)).listRepositories("octocat"))
				.isInstanceOf(GitHubClientException.class)
				.hasMessage("GitHub response could not be parsed");
	}

	@Test
	void timeoutBecomesAControlledClientException() {
		this.responseDelay = Duration.ofMillis(200);
		GitHubHttpClient client = new GitHubHttpClient(properties(null), new ObjectMapper(), HttpClient.newHttpClient(),
				this.baseUri, Duration.ofMillis(40));

		assertThatThrownBy(() -> client.listRepositories("octocat"))
				.isInstanceOf(GitHubClientException.class)
				.hasMessage("GitHub request failed");
	}

	@Test
	void partialRepositoryObjectsAreMappedWithoutFailingTheWholeResponse() {
		this.responseBody = """
				[
				  {"name": "complete", "stargazers_count": 1, "pushed_at": "2026-08-01T12:00:00Z"},
				  "unexpected-item",
				  {"name": 42, "stargazers_count": "many", "fork": "no"}
				]
				""";

		List<GitHubRepositoryData> repositories = client(properties(null)).listRepositories("octocat");

		assertThat(repositories).hasSize(2);
		assertThat(repositories.get(0).name()).isEqualTo("complete");
		assertThat(repositories.get(1).name()).isNull();
		assertThat(repositories.get(1).stars()).isNull();
	}

	private GitHubHttpClient client(GitHubProperties properties) {
		return new GitHubHttpClient(properties, new ObjectMapper(), HttpClient.newHttpClient(), this.baseUri);
	}

	private static GitHubProperties properties(String token) {
		GitHubProperties properties = new GitHubProperties();

		properties.setUsername("octocat");
		properties.setToken(token);
		return properties;
	}

	private void handleRequest(HttpExchange exchange) throws IOException {
		this.authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
		this.requestTarget.set(exchange.getRequestURI().toString());
		this.requestMethod.set(exchange.getRequestMethod());
		this.requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
		byte[] response = this.responseBody.getBytes(StandardCharsets.UTF_8);

		if (!this.responseDelay.isZero()) {
			try {
				Thread.sleep(this.responseDelay);
			}
			catch (InterruptedException exception) {
				Thread.currentThread().interrupt();
			}
		}

		exchange.getResponseHeaders().set("Content-Type", "application/json");
		exchange.sendResponseHeaders(this.responseStatus, response.length);
		exchange.getResponseBody().write(response);
		exchange.close();
	}

}
