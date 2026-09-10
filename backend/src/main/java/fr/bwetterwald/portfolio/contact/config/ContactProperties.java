package fr.bwetterwald.portfolio.contact.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("portfolio.contact")
public class ContactProperties {

	private DeliveryMode deliveryMode = DeliveryMode.LOG;

	private String recipient;

	private String sender;

	private String subjectPrefix = "[Contact Portfolio]";

	private final RateLimit rateLimit = new RateLimit();

	public DeliveryMode getDeliveryMode() {
		return this.deliveryMode;
	}

	public void setDeliveryMode(DeliveryMode deliveryMode) {
		this.deliveryMode = deliveryMode;
	}

	public String getRecipient() {
		return normalize(this.recipient);
	}

	public void setRecipient(String recipient) {
		this.recipient = normalize(recipient);
	}

	public String getSender() {
		return normalize(this.sender);
	}

	public void setSender(String sender) {
		this.sender = normalize(sender);
	}

	public String getSubjectPrefix() {
		return normalize(this.subjectPrefix);
	}

	public void setSubjectPrefix(String subjectPrefix) {
		this.subjectPrefix = normalize(subjectPrefix);
	}

	public RateLimit getRateLimit() {
		return this.rateLimit;
	}

	private static String normalize(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

	public enum DeliveryMode {
		DISABLED,
		LOG,
		SMTP
	}

	public static class RateLimit {

		private int maxSubmissions = 5;

		private Duration window = Duration.ofMinutes(15);

		private int maxClients = 2048;

		public int getMaxSubmissions() {
			return this.maxSubmissions;
		}

		public void setMaxSubmissions(int maxSubmissions) {
			this.maxSubmissions = maxSubmissions;
		}

		public Duration getWindow() {
			return this.window;
		}

		public void setWindow(Duration window) {
			this.window = window;
		}

		public int getMaxClients() {
			return this.maxClients;
		}

		public void setMaxClients(int maxClients) {
			this.maxClients = maxClients;
		}

	}

}
