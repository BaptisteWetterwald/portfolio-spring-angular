package fr.bwetterwald.portfolio.github.application;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayDeque;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.atomic.AtomicInteger;

import fr.bwetterwald.portfolio.github.api.GitHubActivityDto;
import fr.bwetterwald.portfolio.github.client.GitHubClient;
import fr.bwetterwald.portfolio.github.client.GitHubClientException;
import fr.bwetterwald.portfolio.github.client.GitHubContributionCalendarData;
import fr.bwetterwald.portfolio.github.client.GitHubContributionClient;
import fr.bwetterwald.portfolio.github.client.GitHubContributionDayData;
import fr.bwetterwald.portfolio.github.client.GitHubRepositoryData;
import fr.bwetterwald.portfolio.github.config.GitHubProperties;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GitHubActivityServiceTests {

	private static final Instant START = Instant.parse("2026-09-07T10:00:00Z");

	@Test
	void disabledIntegrationReturnsUnavailableWithoutCallingGitHub() {
		AtomicInteger calls = new AtomicInteger();
		GitHubClient client = (username) -> {
			calls.incrementAndGet();
			return List.of();
		};

		GitHubActivityDto activity = service(client, new GitHubProperties(), new MutableClock(START)).getActivity();

		assertThat(activity.available()).isFalse();
		assertThat(activity.repositories()).isEmpty();
		assertThat(calls).hasValue(0);
	}

	@Test
	void mapsRecentMeaningfulRepositoriesAndRejectsForksArchivesAndMalformedItems() {
		GitHubClient client = (username) -> List.of(
				repository("older", "2026-07-01T00:00:00Z", 1),
				repository("newest", "2026-09-01T00:00:00Z", 8),
				new GitHubRepositoryData("forked", null, "Java", 50, "2026-09-06T00:00:00Z", true, false,
						false),
				new GitHubRepositoryData("archived", null, "Java", 50, "2026-09-05T00:00:00Z", false, true,
						false),
				new GitHubRepositoryData("bad date", null, "Java", 50, "not-an-instant", false, false,
						false),
				repository("middle", "2026-08-01T00:00:00Z", null),
				repository("fourth", "2026-06-01T00:00:00Z", 2));

		GitHubActivityDto activity = service(client, enabledProperties(), new MutableClock(START)).getActivity();

		assertThat(activity.available()).isTrue();
		assertThat(activity.stale()).isFalse();
		assertThat(activity.profileUrl()).isEqualTo("https://github.com/octocat");
		assertThat(activity.lastRefreshedAt()).isEqualTo(START);
		assertThat(activity.repositories()).extracting("name").containsExactly("newest", "middle", "older");
		assertThat(activity.repositories().get(0).url()).isEqualTo("https://github.com/octocat/newest");
		assertThat(activity.repositories().get(1).stars()).isZero();
		assertThat(activity.contributionCalendar()).isNull();
	}

	@Test
	void missingTokenKeepsRepositoriesAvailableWithoutCallingGraphQl() {
		AtomicInteger contributionCalls = new AtomicInteger();
		GitHubContributionClient contributionClient = (username) -> {
			contributionCalls.incrementAndGet();
			return calendar(2);
		};

		GitHubActivityDto activity = service(
				(username) -> List.of(repository("portfolio", "2026-09-01T00:00:00Z", 2)),
				contributionClient, enabledProperties(), new MutableClock(START)).getActivity();

		assertThat(activity.available()).isTrue();
		assertThat(activity.repositories()).hasSize(1);
		assertThat(activity.contributionCalendar()).isNull();
		assertThat(contributionCalls).hasValue(0);
	}

	@Test
	void mapsContributionCalendarTotalsDatesAndCountsWhenTokenIsConfigured() {
		GitHubActivityDto activity = service((username) -> List.of(), (username) -> calendar(7),
				enabledPropertiesWithToken(), new MutableClock(START)).getActivity();

		assertThat(activity.available()).isTrue();
		assertThat(activity.repositories()).isEmpty();
		assertThat(activity.contributionCalendar()).isNotNull();
		assertThat(activity.contributionCalendar().totalContributions()).isEqualTo(7);
		assertThat(activity.contributionCalendar().startsOn()).isEqualTo(LocalDate.parse("2026-09-06"));
		assertThat(activity.contributionCalendar().endsOn()).isEqualTo(LocalDate.parse("2026-09-08"));
		assertThat(activity.contributionCalendar().days()).extracting("contributionCount")
				.containsExactly(0, 2, 5);
	}

	@Test
	void graphQlFailureDoesNotDiscardSuccessfulRepositoryActivity() {
		GitHubActivityDto activity = service(
				(username) -> List.of(repository("portfolio", "2026-09-01T00:00:00Z", 2)),
				(username) -> {
					throw new GitHubClientException("GraphQL rate limited");
				}, enabledPropertiesWithToken(), new MutableClock(START)).getActivity();

		assertThat(activity.available()).isTrue();
		assertThat(activity.repositories()).hasSize(1);
		assertThat(activity.contributionCalendar()).isNull();
	}

	@Test
	void repositoryFailureDoesNotDiscardSuccessfulContributionCalendar() {
		GitHubActivityDto activity = service((username) -> {
			throw new GitHubClientException("REST unavailable");
		}, (username) -> calendar(7), enabledPropertiesWithToken(), new MutableClock(START)).getActivity();

		assertThat(activity.available()).isTrue();
		assertThat(activity.repositories()).isEmpty();
		assertThat(activity.contributionCalendar()).isNotNull();
		assertThat(activity.contributionCalendar().totalContributions()).isEqualTo(7);
	}

	@Test
	void failedContributionRefreshServesItsStaleCalendarAlongsideFreshRepositories() {
		AtomicInteger contributionCalls = new AtomicInteger();
		GitHubContributionClient contributionClient = (username) -> {
			if (contributionCalls.getAndIncrement() == 0) {
				return calendar(7);
			}
			throw new GitHubClientException("GraphQL unavailable");
		};
		MutableClock clock = new MutableClock(START);
		GitHubActivityService service = service(
				(username) -> List.of(repository("portfolio", "2026-09-01T00:00:00Z", 2)),
				contributionClient, enabledPropertiesWithToken(), clock);
		GitHubActivityDto fresh = service.getActivity();

		clock.advance(GitHubActivityService.CACHE_TTL);
		GitHubActivityDto partiallyStale = service.getActivity();
		clock.advance(Duration.ofMinutes(1));
		GitHubActivityDto backedOff = service.getActivity();

		assertThat(partiallyStale.available()).isTrue();
		assertThat(partiallyStale.stale()).isTrue();
		assertThat(partiallyStale.contributionCalendar()).isEqualTo(fresh.contributionCalendar());
		assertThat(backedOff.contributionCalendar()).isEqualTo(fresh.contributionCalendar());
		assertThat(contributionCalls).hasValue(2);
	}

	@Test
	void freshCacheAvoidsAnotherGitHubRequest() {
		AtomicInteger calls = new AtomicInteger();
		GitHubClient client = (username) -> {
			calls.incrementAndGet();
			return List.of(repository("portfolio", "2026-09-01T00:00:00Z", 2));
		};
		MutableClock clock = new MutableClock(START);
		GitHubActivityService service = service(client, enabledProperties(), clock);

		GitHubActivityDto first = service.getActivity();
		clock.advance(Duration.ofMinutes(29));
		GitHubActivityDto second = service.getActivity();

		assertThat(second).isEqualTo(first);
		assertThat(calls).hasValue(1);
	}

	@Test
	void freshCacheAvoidsDuplicateRestAndGraphQlRequests() {
		AtomicInteger repositoryCalls = new AtomicInteger();
		AtomicInteger contributionCalls = new AtomicInteger();
		MutableClock clock = new MutableClock(START);
		GitHubActivityService service = service((username) -> {
			repositoryCalls.incrementAndGet();
			return List.of(repository("portfolio", "2026-09-01T00:00:00Z", 2));
		}, (username) -> {
			contributionCalls.incrementAndGet();
			return calendar(7);
		}, enabledPropertiesWithToken(), clock);

		GitHubActivityDto first = service.getActivity();
		clock.advance(Duration.ofMinutes(29));
		GitHubActivityDto second = service.getActivity();

		assertThat(second).isEqualTo(first);
		assertThat(repositoryCalls).hasValue(1);
		assertThat(contributionCalls).hasValue(1);
	}

	@Test
	void expiredCacheRefreshesAndReplacesThePreviousData() {
		Queue<List<GitHubRepositoryData>> responses = new ArrayDeque<>();
		responses.add(List.of(repository("first", "2026-08-01T00:00:00Z", 0)));
		responses.add(List.of(repository("second", "2026-09-01T00:00:00Z", 0)));
		AtomicInteger calls = new AtomicInteger();
		GitHubClient client = (username) -> {
			calls.incrementAndGet();
			return responses.remove();
		};
		MutableClock clock = new MutableClock(START);
		GitHubActivityService service = service(client, enabledProperties(), clock);

		service.getActivity();
		clock.advance(GitHubActivityService.CACHE_TTL);
		GitHubActivityDto refreshed = service.getActivity();

		assertThat(refreshed.repositories()).extracting("name").containsExactly("second");
		assertThat(refreshed.lastRefreshedAt()).isEqualTo(clock.instant());
		assertThat(calls).hasValue(2);
	}

	@Test
	void failedRefreshServesStaleDataAndBacksOffBeforeRetrying() {
		AtomicInteger calls = new AtomicInteger();
		GitHubClient client = (username) -> {
			if (calls.getAndIncrement() == 0) {
				return List.of(repository("cached", "2026-08-01T00:00:00Z", 3));
			}
			throw new GitHubClientException("upstream unavailable");
		};
		MutableClock clock = new MutableClock(START);
		GitHubActivityService service = service(client, enabledProperties(), clock);
		GitHubActivityDto fresh = service.getActivity();

		clock.advance(GitHubActivityService.CACHE_TTL);
		GitHubActivityDto stale = service.getActivity();
		clock.advance(Duration.ofMinutes(1));
		GitHubActivityDto backedOff = service.getActivity();

		assertThat(stale.available()).isTrue();
		assertThat(stale.stale()).isTrue();
		assertThat(stale.repositories()).isEqualTo(fresh.repositories());
		assertThat(stale.lastRefreshedAt()).isEqualTo(fresh.lastRefreshedAt());
		assertThat(backedOff).isEqualTo(stale);
		assertThat(calls).hasValue(2);
	}

	@Test
	void firstFailureReturnsUnavailableAndNegativeCachesTheFailureBriefly() {
		AtomicInteger calls = new AtomicInteger();
		GitHubClient client = (username) -> {
			calls.incrementAndGet();
			throw new GitHubClientException("rate limited");
		};
		MutableClock clock = new MutableClock(START);
		GitHubActivityService service = service(client, enabledProperties(), clock);

		GitHubActivityDto unavailable = service.getActivity();
		clock.advance(Duration.ofMinutes(1));
		GitHubActivityDto backedOff = service.getActivity();

		assertThat(unavailable).isEqualTo(GitHubActivityDto.unavailable());
		assertThat(backedOff).isEqualTo(unavailable);
		assertThat(calls).hasValue(1);
	}

	private static GitHubActivityService service(GitHubClient client, GitHubProperties properties,
			MutableClock clock) {
		return service(client, (username) -> {
			throw new AssertionError("Contribution client must not run without a token");
		}, properties, clock);
	}

	private static GitHubActivityService service(GitHubClient client, GitHubContributionClient contributionClient,
			GitHubProperties properties, MutableClock clock) {
		return new GitHubActivityService(client, contributionClient, properties, clock);
	}

	private static GitHubProperties enabledProperties() {
		GitHubProperties properties = new GitHubProperties();

		properties.setUsername("octocat");
		return properties;
	}

	private static GitHubProperties enabledPropertiesWithToken() {
		GitHubProperties properties = enabledProperties();

		properties.setToken("test-token-value");
		return properties;
	}

	private static GitHubContributionCalendarData calendar(int totalContributions) {
		return new GitHubContributionCalendarData(totalContributions, List.of(
				new GitHubContributionDayData(LocalDate.parse("2026-09-06"), 0),
				new GitHubContributionDayData(LocalDate.parse("2026-09-07"), 2),
				new GitHubContributionDayData(LocalDate.parse("2026-09-08"), 5)));
	}

	private static GitHubRepositoryData repository(String name, String pushedAt, Integer stars) {
		return new GitHubRepositoryData(name, " Description for " + name + " ", "Java", stars, pushedAt, false,
				false, false);
	}

	private static final class MutableClock extends Clock {

		private Instant current;

		private MutableClock(Instant current) {
			this.current = current;
		}

		void advance(Duration duration) {
			this.current = this.current.plus(duration);
		}

		@Override
		public ZoneId getZone() {
			return ZoneOffset.UTC;
		}

		@Override
		public Clock withZone(ZoneId zone) {
			return this;
		}

		@Override
		public Instant instant() {
			return this.current;
		}

	}

}
