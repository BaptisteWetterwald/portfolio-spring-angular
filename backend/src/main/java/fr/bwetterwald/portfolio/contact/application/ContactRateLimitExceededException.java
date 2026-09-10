package fr.bwetterwald.portfolio.contact.application;

public class ContactRateLimitExceededException extends RuntimeException {

	private final long retryAfterSeconds;

	public ContactRateLimitExceededException(long retryAfterSeconds) {
		super("Contact rate limit exceeded");
		this.retryAfterSeconds = retryAfterSeconds;
	}

	public long retryAfterSeconds() {
		return this.retryAfterSeconds;
	}

}
