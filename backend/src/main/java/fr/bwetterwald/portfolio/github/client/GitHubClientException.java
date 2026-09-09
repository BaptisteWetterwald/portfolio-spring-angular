package fr.bwetterwald.portfolio.github.client;

public class GitHubClientException extends RuntimeException {

	public GitHubClientException(String message) {
		super(message);
	}

	public GitHubClientException(String message, Throwable cause) {
		super(message, cause);
	}

}
