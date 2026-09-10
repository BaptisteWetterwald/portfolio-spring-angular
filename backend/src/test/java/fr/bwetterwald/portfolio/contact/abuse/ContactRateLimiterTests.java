package fr.bwetterwald.portfolio.contact.abuse;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ContactRateLimiterTests {

	private static final Instant START = Instant.parse("2026-09-09T12:00:00Z");

	@Test
	void slidingWindowReturnsAStableRetryDelayAndAllowsOtherClients() {
		MutableClock clock = new MutableClock(START);
		ContactRateLimiter limiter = limiter(2, Duration.ofMinutes(15), 16, clock);

		assertThat(limiter.acquire("192.0.2.10").allowed()).isTrue();
		clock.advance(Duration.ofMinutes(1));
		assertThat(limiter.acquire("192.0.2.10").allowed()).isTrue();
		ContactRateLimiter.Decision rejected = limiter.acquire("192.0.2.10");

		assertThat(rejected.allowed()).isFalse();
		assertThat(rejected.retryAfterSeconds()).isEqualTo(14 * 60);
		assertThat(limiter.acquire("192.0.2.11").allowed()).isTrue();
	}

	@Test
	void expiredEntriesAreRemovedAutomatically() {
		MutableClock clock = new MutableClock(START);
		ContactRateLimiter limiter = limiter(1, Duration.ofMinutes(15), 16, clock);

		limiter.acquire("192.0.2.10");
		clock.advance(Duration.ofMinutes(15));

		assertThat(limiter.acquire("192.0.2.10").allowed()).isTrue();
		assertThat(limiter.trackedClientCount()).isEqualTo(1);
	}

	@Test
	void trackedClientStateNeverExceedsConfiguredCapacity() {
		ContactRateLimiter limiter = limiter(1, Duration.ofHours(1), 16, new MutableClock(START));

		for (int index = 0; index < 40; index++) {
			limiter.acquire("192.0.2." + index);
		}

		assertThat(limiter.trackedClientCount()).isEqualTo(16);
	}

	private static ContactRateLimiter limiter(int maxSubmissions, Duration window, int maxClients,
			Clock clock) {
		return new ContactRateLimiter(maxSubmissions, window, maxClients, clock, new byte[32]);
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
