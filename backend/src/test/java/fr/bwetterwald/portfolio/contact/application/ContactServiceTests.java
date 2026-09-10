package fr.bwetterwald.portfolio.contact.application;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicReference;

import fr.bwetterwald.portfolio.contact.abuse.ContactRateLimiter;
import fr.bwetterwald.portfolio.contact.api.ContactRequestDto;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ContactServiceTests {

	@Test
	void validSubmissionInvokesSenderWithTheNormalizedVisitorReplyIdentity() {
		AtomicReference<ContactMessage> delivered = new AtomicReference<>();
		ContactService service = service(delivered::set, 5);

		service.submit(new ContactRequestDto("  Ada Lovelace ", " ada@example.test ", " Project ",
				" A message that is comfortably long enough. ", ""), "192.0.2.10");

		assertThat(delivered).hasValue(new ContactMessage("Ada Lovelace", "ada@example.test", "Project",
				"A message that is comfortably long enough."));
	}

	@Test
	void populatedDecoyFieldIsSafelyAbsorbedWithoutSenderInvocation() {
		AtomicReference<ContactMessage> delivered = new AtomicReference<>();
		ContactService service = service(delivered::set, 5);

		service.submit(new ContactRequestDto("Ada", "ada@example.test", "Project",
				"A message that is comfortably long enough.", "https://example.test"), "192.0.2.10");

		assertThat(delivered).hasNullValue();
	}

	@Test
	void deliveryFailureCrossesTheServiceAsAControlledException() {
		ContactService service = service((message) -> {
			throw new ContactDeliveryException(new IllegalStateException("provider detail"));
		}, 5);

		assertThatThrownBy(() -> service.submit(validRequest(), "192.0.2.10"))
			.isInstanceOf(ContactDeliveryException.class);
	}

	@Test
	void rateLimitRunsBeforeDecoyHandlingAndDelivery() {
		AtomicReference<ContactMessage> delivered = new AtomicReference<>();
		ContactService service = service(delivered::set, 1);

		service.submit(validRequest(), "192.0.2.10");

		assertThatThrownBy(() -> service.submit(validRequest(), "192.0.2.10"))
			.isInstanceOf(ContactRateLimitExceededException.class);
	}

	private static ContactService service(ContactMessageSender sender, int maxSubmissions) {
		return new ContactService(sender,
				new ContactRateLimiter(maxSubmissions, Duration.ofMinutes(15), 16));
	}

	private static ContactRequestDto validRequest() {
		return new ContactRequestDto("Ada Lovelace", "ada@example.test", "Project conversation",
				"I would like to discuss a software project with you.", "");
	}

}
