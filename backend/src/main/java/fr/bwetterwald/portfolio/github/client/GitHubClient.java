package fr.bwetterwald.portfolio.github.client;

import java.util.List;

public interface GitHubClient {

	List<GitHubRepositoryData> listRepositories(String username);

}
