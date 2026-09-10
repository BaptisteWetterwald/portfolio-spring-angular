package fr.bwetterwald.portfolio.contact.api;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import fr.bwetterwald.portfolio.common.error.ApiExceptionHandler;
import fr.bwetterwald.portfolio.contact.abuse.ContactRateLimiter;
import fr.bwetterwald.portfolio.contact.application.ContactDeliveryException;
import fr.bwetterwald.portfolio.contact.application.ContactMessage;
import fr.bwetterwald.portfolio.contact.application.ContactMessageSender;
import fr.bwetterwald.portfolio.contact.application.ContactService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ContactControllerTests {

	private static final String VALID_JSON = """
			{
			  "name": "  Ada Lovelace  ",
			  "email": "  ada@example.test  ",
			  "subject": "  Project conversation  ",
			  "message": "  I would like to discuss a software project with you.  ",
			  "organizationWebsite": ""
			}
			""";

	@Test
	void validSubmissionReturnsNoContentAndInvokesTheSender() throws Exception {
		AtomicReference<ContactMessage> delivered = new AtomicReference<>();
		MockMvc mockMvc = mockMvc(delivered::set, 5);

		mockMvc.perform(post("/api/v1/contact").contentType(MediaType.APPLICATION_JSON).content(VALID_JSON))
			.andExpect(status().isNoContent())
			.andExpect(content().string(""));

		org.assertj.core.api.Assertions.assertThat(delivered).hasValue(new ContactMessage("Ada Lovelace",
				"ada@example.test", "Project conversation",
				"I would like to discuss a software project with you."));
	}

	@Test
	void requiredAndInvalidFieldsUseTheSharedSafeApiError() throws Exception {
		MockMvc mockMvc = mockMvc((message) -> {
			throw new AssertionError("Invalid request must not reach sender");
		}, 5);

		mockMvc.perform(post("/api/v1/contact").contentType(MediaType.APPLICATION_JSON)
			.content("{\"name\":\" \",\"email\":\"invalid\",\"subject\":\"\",\"message\":\"short\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.status").value(400))
			.andExpect(jsonPath("$.code").value("bad_request"))
			.andExpect(jsonPath("$.message").value("The request is invalid."))
			.andExpect(jsonPath("$.recipient").doesNotExist())
			.andExpect(jsonPath("$.provider").doesNotExist());
	}

	@Test
	void oversizedValuesAndMalformedJsonAreRejectedWithoutExceptionDetails() throws Exception {
		MockMvc mockMvc = mockMvc((message) -> {
			throw new AssertionError("Invalid request must not reach sender");
		}, 5);
		String oversized = VALID_JSON.replace("Ada Lovelace", "n".repeat(101));

		mockMvc.perform(post("/api/v1/contact").contentType(MediaType.APPLICATION_JSON).content(oversized))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("bad_request"));

		mockMvc.perform(post("/api/v1/contact").contentType(MediaType.APPLICATION_JSON).content("{not-json"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("bad_request"))
			.andExpect(content().string(not(containsString("JsonParseException"))));
	}

	@Test
	void headerInjectionInputIsRejectedBeforeDelivery() throws Exception {
		MockMvc mockMvc = mockMvc((message) -> {
			throw new AssertionError("Injected request must not reach sender");
		}, 5);
		String injected = VALID_JSON.replace("Project conversation", "Hello\\r\\nBcc: other@example.test");

		mockMvc.perform(post("/api/v1/contact").contentType(MediaType.APPLICATION_JSON).content(injected))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("bad_request"));
	}

	@Test
	void populatedDecoyIsAbsorbedWithoutDelivery() throws Exception {
		AtomicInteger deliveries = new AtomicInteger();
		MockMvc mockMvc = mockMvc((message) -> deliveries.incrementAndGet(), 5);
		String botJson = VALID_JSON.replace("\"organizationWebsite\": \"\"",
				"\"organizationWebsite\": \"https://example.test\"");

		mockMvc.perform(post("/api/v1/contact").contentType(MediaType.APPLICATION_JSON).content(botJson))
			.andExpect(status().isNoContent());

		org.assertj.core.api.Assertions.assertThat(deliveries).hasValue(0);
	}

	@Test
	void rateLimitReturns429WithRetryAfterAndDoesNotTrustArbitraryForwardedHeaders() throws Exception {
		AtomicInteger deliveries = new AtomicInteger();
		MockMvc mockMvc = mockMvc((message) -> deliveries.incrementAndGet(), 1);

		mockMvc.perform(post("/api/v1/contact").with((request) -> {
			request.setRemoteAddr("192.0.2.10");
			return request;
		}).header("X-Forwarded-For", "198.51.100.10").contentType(MediaType.APPLICATION_JSON).content(VALID_JSON))
			.andExpect(status().isNoContent());

		mockMvc.perform(post("/api/v1/contact").with((request) -> {
			request.setRemoteAddr("192.0.2.10");
			return request;
		}).header("X-Forwarded-For", "203.0.113.20").contentType(MediaType.APPLICATION_JSON).content(VALID_JSON))
			.andExpect(status().isTooManyRequests())
			.andExpect(header().string("Retry-After", "900"))
			.andExpect(jsonPath("$.code").value("contact_rate_limited"));

		org.assertj.core.api.Assertions.assertThat(deliveries).hasValue(1);
	}

	@Test
	void deliveryFailureDoesNotLeakProviderRecipientOrSecretDetails() throws Exception {
		MockMvc mockMvc = mockMvc((message) -> {
			throw new ContactDeliveryException(
					new IllegalStateException("smtp.provider.example owner@example.test private-token"));
		}, 5);

		mockMvc.perform(post("/api/v1/contact").contentType(MediaType.APPLICATION_JSON).content(VALID_JSON))
			.andExpect(status().isBadGateway())
			.andExpect(jsonPath("$.code").value("contact_delivery_failed"))
			.andExpect(jsonPath("$.message").value("The contact message could not be delivered."))
			.andExpect(content().string(not(containsString("smtp.provider.example"))))
			.andExpect(content().string(not(containsString("owner@example.test"))))
			.andExpect(content().string(not(containsString("private-token"))));
	}

	private static MockMvc mockMvc(ContactMessageSender sender, int maxSubmissions) {
		ContactService service = new ContactService(sender,
				new ContactRateLimiter(maxSubmissions, Duration.ofMinutes(15), 16));

		return MockMvcBuilders.standaloneSetup(new ContactController(service))
			.setControllerAdvice(new ApiExceptionHandler())
			.build();
	}

}
