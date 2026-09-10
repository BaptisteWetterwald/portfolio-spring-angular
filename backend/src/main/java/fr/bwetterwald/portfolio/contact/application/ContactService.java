package fr.bwetterwald.portfolio.contact.application;

import fr.bwetterwald.portfolio.contact.api.ContactRequestDto;
import fr.bwetterwald.portfolio.contact.abuse.ContactRateLimiter;
import org.springframework.stereotype.Service;

@Service
public class ContactService {

	private final ContactMessageSender messageSender;

	private final ContactRateLimiter rateLimiter;

	public ContactService(ContactMessageSender messageSender, ContactRateLimiter rateLimiter) {
		this.messageSender = messageSender;
		this.rateLimiter = rateLimiter;
	}

	public void submit(ContactRequestDto request, String clientAddress) {
		ContactRateLimiter.Decision decision = this.rateLimiter.acquire(clientAddress);

		if (!decision.allowed()) {
			throw new ContactRateLimitExceededException(decision.retryAfterSeconds());
		}

		if (request.organizationWebsite() != null && !request.organizationWebsite().isBlank()) {
			return;
		}

		this.messageSender.send(new ContactMessage(request.name(), request.email(), request.subject(), request.message()));
	}

}
