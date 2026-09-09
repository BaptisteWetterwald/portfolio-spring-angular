package fr.bwetterwald.portfolio.github.application;

import java.net.URI;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.locks.ReentrantLock;
import java.util.regex.Pattern;

import fr.bwetterwald.portfolio.github.api.GitHubActivityDto;
import fr.bwetterwald.portfolio.github.api.GitHubContributionCalendarDto;
import fr.bwetterwald.portfolio.github.api.GitHubContributionDayDto;
import fr.bwetterwald.portfolio.github.api.GitHubRepositoryActivityDto;
import fr.bwetterwald.portfolio.github.client.GitHubClient;
import fr.bwetterwald.portfolio.github.client.GitHubContributionCalendarData;
import fr.bwetterwald.portfolio.github.client.GitHubContributionClient;
import fr.bwetterwald.portfolio.github.client.GitHubRepositoryData;
import fr.bwetterwald.portfolio.github.config.GitHubProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class GitHubActivityService {

	static final Duration CACHE_TTL = Duration.ofMinutes(30);

	static final Duration ERROR_RETRY_TTL = Duration.ofMinutes(2);

	static final int REPOSITORY_LIMIT = 3;

	private static final Pattern REPOSITORY_NAME_PATTERN = Pattern.compile("^[A-Za-z0-9._-]{1,100}$");

	private final GitHubClient gitHubClient;

	private final GitHubContributionClient gitHubContributionClient;

	private final GitHubProperties properties;

	private final Clock clock;

	private final ReentrantLock refreshLock = new ReentrantLock();

	private volatile CacheEntry<List<GitHubRepositoryActivityDto>> repositoriesCacheEntry;

	private volatile CacheEntry<GitHubContributionCalendarDto> contributionCacheEntry;

	@Autowired
	public GitHubActivityService(GitHubClient gitHubClient, GitHubContributionClient gitHubContributionClient,
			GitHubProperties properties) {
		this(gitHubClient, gitHubContributionClient, properties, Clock.systemUTC());
	}

	GitHubActivityService(GitHubClient gitHubClient, GitHubContributionClient gitHubContributionClient,
			GitHubProperties properties, Clock clock) {
		this.gitHubClient = gitHubClient;
		this.gitHubContributionClient = gitHubContributionClient;
		this.properties = properties;
		this.clock = clock;
	}

	public GitHubActivityDto getActivity() {
		String username = this.properties.username().orElse(null);

		if (username == null) {
			return GitHubActivityDto.unavailable();
		}

		boolean contributionsEnabled = this.properties.token().isPresent();
		Instant now = this.clock.instant();
		CacheEntry<List<GitHubRepositoryActivityDto>> repositories = this.repositoriesCacheEntry;
		CacheEntry<GitHubContributionCalendarDto> contributionCalendar = this.contributionCacheEntry;

		if (isFresh(repositories, now) && (!contributionsEnabled || isFresh(contributionCalendar, now))) {
			return combinedActivity(username, repositories, contributionsEnabled ? contributionCalendar : null);
		}

		this.refreshLock.lock();
		try {
			repositories = this.repositoriesCacheEntry;
			contributionCalendar = this.contributionCacheEntry;
			now = this.clock.instant();

			if (!isFresh(repositories, now)) {
				repositories = refreshRepositories(username, now, repositories);
				this.repositoriesCacheEntry = repositories;
			}

			if (contributionsEnabled && !isFresh(contributionCalendar, now)) {
				contributionCalendar = refreshContributionCalendar(username, now, contributionCalendar);
				this.contributionCacheEntry = contributionCalendar;
			}

			return combinedActivity(username, repositories, contributionsEnabled ? contributionCalendar : null);
		}
		finally {
			this.refreshLock.unlock();
		}
	}

	private CacheEntry<List<GitHubRepositoryActivityDto>> refreshRepositories(String username, Instant refreshedAt,
			CacheEntry<List<GitHubRepositoryActivityDto>> current) {
		try {
			List<GitHubRepositoryActivityDto> repositories = this.gitHubClient.listRepositories(username)
				.stream()
				.filter(GitHubActivityService::isDisplayable)
				.map((repository) -> toActivity(username, repository))
				.filter((repository) -> repository != null)
				.sorted(Comparator.comparing(GitHubRepositoryActivityDto::lastActivityAt).reversed()
					.thenComparing(GitHubRepositoryActivityDto::name, String.CASE_INSENSITIVE_ORDER))
				.limit(REPOSITORY_LIMIT)
				.toList();

			return successful(repositories, refreshedAt);
		}
		catch (RuntimeException exception) {
			return failed(current, refreshedAt);
		}
	}

	private CacheEntry<GitHubContributionCalendarDto> refreshContributionCalendar(String username, Instant refreshedAt,
			CacheEntry<GitHubContributionCalendarDto> current) {
		try {
			GitHubContributionCalendarData contributionCalendar = this.gitHubContributionClient
					.getContributionCalendar(username);
			List<GitHubContributionDayDto> days = contributionCalendar.days()
				.stream()
				.map((day) -> new GitHubContributionDayDto(day.date(), day.contributionCount()))
				.toList();

			if (days.isEmpty()) {
				throw new IllegalArgumentException("GitHub contribution calendar contains no days");
			}

			GitHubContributionCalendarDto calendar = new GitHubContributionCalendarDto(
					contributionCalendar.totalContributions(), days.getFirst().date(), days.getLast().date(), days);

			return successful(calendar, refreshedAt);
		}
		catch (RuntimeException exception) {
			return failed(current, refreshedAt);
		}
	}

	private static GitHubActivityDto combinedActivity(String username,
			CacheEntry<List<GitHubRepositoryActivityDto>> repositoriesEntry,
			CacheEntry<GitHubContributionCalendarDto> contributionEntry) {
		List<GitHubRepositoryActivityDto> repositories = value(repositoriesEntry, List.of());
		GitHubContributionCalendarDto contributionCalendar = value(contributionEntry, null);
		boolean available = !repositories.isEmpty() || contributionCalendar != null;

		if (!available) {
			return GitHubActivityDto.unavailable();
		}

		return new GitHubActivityDto(true, profileUrl(username), repositories, contributionCalendar,
				latestRefresh(repositoriesEntry, contributionEntry), isStale(repositoriesEntry) || isStale(contributionEntry));
	}

	private static boolean isDisplayable(GitHubRepositoryData repository) {
		return repository != null && !Boolean.TRUE.equals(repository.fork())
				&& !Boolean.TRUE.equals(repository.archived()) && !Boolean.TRUE.equals(repository.disabled())
				&& repository.name() != null && REPOSITORY_NAME_PATTERN.matcher(repository.name()).matches()
				&& repository.pushedAt() != null;
	}

	private static GitHubRepositoryActivityDto toActivity(String username, GitHubRepositoryData repository) {
		try {
			Instant lastActivityAt = Instant.parse(repository.pushedAt());

			return new GitHubRepositoryActivityDto(repository.name(), repositoryUrl(username, repository.name()),
					normalizeText(repository.description()), normalizeText(repository.language()),
					Math.max(0, repository.stars() == null ? 0 : repository.stars()), lastActivityAt);
		}
		catch (DateTimeParseException exception) {
			return null;
		}
	}

	private static boolean isFresh(CacheEntry<?> entry, Instant now) {
		return entry != null && now.isBefore(entry.refreshAfter());
	}

	private static <T> CacheEntry<T> successful(T value, Instant refreshedAt) {
		return new CacheEntry<>(value, refreshedAt, refreshedAt.plus(CACHE_TTL), false);
	}

	private static <T> CacheEntry<T> failed(CacheEntry<T> current, Instant failedAt) {
		if (current != null && current.value() != null) {
			return new CacheEntry<>(current.value(), current.refreshedAt(), failedAt.plus(ERROR_RETRY_TTL), true);
		}

		return new CacheEntry<>(null, null, failedAt.plus(ERROR_RETRY_TTL), false);
	}

	private static <T> T value(CacheEntry<T> entry, T fallback) {
		return entry == null || entry.value() == null ? fallback : entry.value();
	}

	private static boolean isStale(CacheEntry<?> entry) {
		return entry != null && entry.value() != null && entry.stale();
	}

	private static Instant latestRefresh(CacheEntry<?> first, CacheEntry<?> second) {
		Instant firstRefresh = first == null || first.value() == null ? null : first.refreshedAt();
		Instant secondRefresh = second == null || second.value() == null ? null : second.refreshedAt();

		if (firstRefresh == null) {
			return secondRefresh;
		}
		if (secondRefresh == null) {
			return firstRefresh;
		}

		return firstRefresh.isAfter(secondRefresh) ? firstRefresh : secondRefresh;
	}

	private static String normalizeText(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}

	private static String profileUrl(String username) {
		return URI.create("https://github.com/" + username).toString();
	}

	private static String repositoryUrl(String username, String repositoryName) {
		return URI.create("https://github.com/" + username + "/" + repositoryName).toString();
	}

	private record CacheEntry<T>(T value, Instant refreshedAt, Instant refreshAfter, boolean stale) {
	}

}
