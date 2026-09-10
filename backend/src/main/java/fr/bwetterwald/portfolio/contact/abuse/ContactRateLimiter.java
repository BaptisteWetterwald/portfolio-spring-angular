package fr.bwetterwald.portfolio.contact.abuse;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Base64;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

public class ContactRateLimiter {

	private static final String UNKNOWN_CLIENT = "unknown";

	private final int maxSubmissions;

	private final Duration window;

	private final int maxClients;

	private final Clock clock;

	private final byte[] addressSalt;

	private final Map<String, ArrayDeque<Instant>> submissionsByClient = new LinkedHashMap<>(16, 0.75f, true);

	public ContactRateLimiter(int maxSubmissions, Duration window, int maxClients) {
		this(maxSubmissions, window, maxClients, Clock.systemUTC(), randomSalt());
	}

	ContactRateLimiter(int maxSubmissions, Duration window, int maxClients, Clock clock, byte[] addressSalt) {
		if (maxSubmissions < 1 || maxSubmissions > 50) {
			throw new IllegalArgumentException("Contact rate limit must allow between 1 and 50 submissions");
		}
		if (window == null || window.isNegative() || window.isZero() || window.compareTo(Duration.ofDays(1)) > 0) {
			throw new IllegalArgumentException("Contact rate-limit window must be between 1 millisecond and 1 day");
		}
		if (maxClients < 16 || maxClients > 10_000) {
			throw new IllegalArgumentException("Contact rate-limit client capacity must be between 16 and 10000");
		}

		this.maxSubmissions = maxSubmissions;
		this.window = window;
		this.maxClients = maxClients;
		this.clock = clock;
		this.addressSalt = addressSalt.clone();
	}

	public synchronized Decision acquire(String clientAddress) {
		Instant now = this.clock.instant();
		Instant cutoff = now.minus(this.window);

		removeExpired(cutoff);

		String clientKey = hashAddress(clientAddress);
		ArrayDeque<Instant> submissions = this.submissionsByClient.get(clientKey);

		if (submissions == null) {
			ensureCapacity();
			submissions = new ArrayDeque<>(this.maxSubmissions);
			this.submissionsByClient.put(clientKey, submissions);
		}

		if (submissions.size() >= this.maxSubmissions) {
			Duration remaining = Duration.between(now, submissions.getFirst().plus(this.window));
			long retryAfterSeconds = Math.max(1, remaining.getSeconds() + (remaining.getNano() > 0 ? 1 : 0));

			return new Decision(false, retryAfterSeconds);
		}

		submissions.addLast(now);
		return new Decision(true, 0);
	}

	int trackedClientCount() {
		return this.submissionsByClient.size();
	}

	private void removeExpired(Instant cutoff) {
		Iterator<ArrayDeque<Instant>> iterator = this.submissionsByClient.values().iterator();

		while (iterator.hasNext()) {
			ArrayDeque<Instant> submissions = iterator.next();

			while (!submissions.isEmpty() && !submissions.getFirst().isAfter(cutoff)) {
				submissions.removeFirst();
			}

			if (submissions.isEmpty()) {
				iterator.remove();
			}
		}
	}

	private void ensureCapacity() {
		if (this.submissionsByClient.size() < this.maxClients) {
			return;
		}

		Iterator<String> iterator = this.submissionsByClient.keySet().iterator();

		if (iterator.hasNext()) {
			iterator.next();
			iterator.remove();
		}
	}

	private String hashAddress(String clientAddress) {
		String normalizedAddress = clientAddress == null || clientAddress.isBlank()
				? UNKNOWN_CLIENT : clientAddress.strip().toLowerCase(Locale.ROOT);

		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");

			digest.update(this.addressSalt);
			return Base64.getUrlEncoder()
				.withoutPadding()
				.encodeToString(digest.digest(normalizedAddress.getBytes(StandardCharsets.UTF_8)));
		}
		catch (NoSuchAlgorithmException exception) {
			throw new IllegalStateException("SHA-256 is unavailable", exception);
		}
	}

	private static byte[] randomSalt() {
		byte[] salt = new byte[32];

		new SecureRandom().nextBytes(salt);
		return salt;
	}

	public record Decision(boolean allowed, long retryAfterSeconds) {
	}

}
