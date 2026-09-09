package fr.bwetterwald.portfolio.github.config;

import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("portfolio.github")
public class GitHubProperties {

	private static final Pattern USERNAME_PATTERN = Pattern.compile("^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$");

	private String username;

	private String token;

	public Optional<String> username() {
		return normalized(this.username);
	}

	public void setUsername(String username) {
		String normalizedUsername = normalize(username);

		if (normalizedUsername != null && !USERNAME_PATTERN.matcher(normalizedUsername).matches()) {
			throw new IllegalArgumentException("portfolio.github.username is not a valid GitHub username");
		}

		this.username = normalizedUsername;
	}

	public Optional<String> token() {
		return normalized(this.token);
	}

	public void setToken(String token) {
		this.token = normalize(token);
	}

	public boolean enabled() {
		return username().isPresent();
	}

	@Override
	public String toString() {
		return "GitHubProperties[enabled=" + enabled() + ", tokenConfigured=" + token().isPresent() + "]";
	}

	private static Optional<String> normalized(String value) {
		return Optional.ofNullable(normalize(value));
	}

	private static String normalize(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}

		return value.trim();
	}

}
