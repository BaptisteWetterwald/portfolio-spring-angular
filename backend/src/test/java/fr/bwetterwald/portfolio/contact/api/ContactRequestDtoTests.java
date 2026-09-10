package fr.bwetterwald.portfolio.contact.api;

import java.util.Set;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ContactRequestDtoTests {

	private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

	@Test
	void constructorNormalizesOuterWhitespaceAndLineEndingsBeforeValidation() {
		ContactRequestDto request = new ContactRequestDto("  Ada Lovelace  ", "  ada@example.test ",
				"  Project conversation  ", "  First line\r\nSecond line with enough text.\r  ", "   ");

		assertThat(request.name()).isEqualTo("Ada Lovelace");
		assertThat(request.email()).isEqualTo("ada@example.test");
		assertThat(request.subject()).isEqualTo("Project conversation");
		assertThat(request.message()).isEqualTo("First line\nSecond line with enough text.");
		assertThat(request.organizationWebsite()).isEmpty();
		assertThat(this.validator.validate(request)).isEmpty();
	}

	@Test
	void requiredFieldsRejectNullEmptyAndWhitespaceOnlyValues() {
		ContactRequestDto request = new ContactRequestDto(null, "   ", "", " \t ", null);

		assertThat(invalidProperties(request)).containsExactlyInAnyOrder("name", "email", "subject", "message");
	}

	@Test
	void invalidEmailAndHeaderLineBreaksAreRejected() {
		ContactRequestDto invalidEmail = validRequest("not-an-email", "Project conversation");
		ContactRequestDto injectedSubject = validRequest("ada@example.test", "Hello\r\nBcc: other@example.test");

		assertThat(invalidProperties(invalidEmail)).contains("email");
		assertThat(invalidProperties(injectedSubject)).contains("subject");
	}

	@Test
	void messageEnforcesNormalizedMinimumAndMaximumLengths() {
		ContactRequestDto tooShort = requestWithMessage("  nineteen chars...  ");
		ContactRequestDto maximum = requestWithMessage("x".repeat(5000));
		ContactRequestDto tooLong = requestWithMessage("x".repeat(5001));

		assertThat(invalidProperties(tooShort)).contains("message");
		assertThat(this.validator.validate(maximum)).isEmpty();
		assertThat(invalidProperties(tooLong)).contains("message");
	}

	@Test
	void singleLineAndDecoyFieldsEnforceTheirMaximumLengths() {
		ContactRequestDto request = new ContactRequestDto("n".repeat(101), "e".repeat(255), "s".repeat(161),
				"This message is long enough.", "w".repeat(201));

		assertThat(invalidProperties(request)).contains("name", "email", "subject", "organizationWebsite");
	}

	@Test
	void nullCharactersAreRejectedWithoutRestrictingOrdinaryUnicode() {
		ContactRequestDto unicode = new ContactRequestDto("Zoë 山田", "zoe@example.test", "Échange technique",
				"Bonjour, ce message contient des caractères Unicode.", "");
		ContactRequestDto nullCharacter = requestWithMessage("A valid-looking message\0with a null character.");

		assertThat(this.validator.validate(unicode)).isEmpty();
		assertThat(invalidProperties(nullCharacter)).contains("message");
	}

	private Set<String> invalidProperties(ContactRequestDto request) {
		return this.validator.validate(request)
			.stream()
			.map(ConstraintViolation::getPropertyPath)
			.map(Object::toString)
			.collect(java.util.stream.Collectors.toSet());
	}

	private static ContactRequestDto validRequest(String email, String subject) {
		return new ContactRequestDto("Ada Lovelace", email, subject,
				"I would like to discuss a software project with you.", "");
	}

	private static ContactRequestDto requestWithMessage(String message) {
		return new ContactRequestDto("Ada Lovelace", "ada@example.test", "Project conversation", message, "");
	}

}
