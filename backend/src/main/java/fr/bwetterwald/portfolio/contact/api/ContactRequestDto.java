package fr.bwetterwald.portfolio.contact.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ContactRequestDto(
		@NotBlank @Size(max = 100) @Pattern(regexp = "^[^\\r\\n\\u0000]*$") String name,
		@NotBlank @Email @Size(max = 254) @Pattern(regexp = "^[^\\r\\n\\u0000]*$") String email,
		@NotBlank @Size(max = 160) @Pattern(regexp = "^[^\\r\\n\\u0000]*$") String subject,
		@NotBlank @Size(min = 20, max = 5000) @Pattern(regexp = "^[^\\u0000]*$") String message,
		@Size(max = 200) @Pattern(regexp = "^[^\\r\\n\\u0000]*$") String organizationWebsite) {

	public ContactRequestDto {
		name = normalizeSingleLine(name);
		email = normalizeSingleLine(email);
		subject = normalizeSingleLine(subject);
		message = normalizeMessage(message);
		organizationWebsite = normalizeSingleLine(organizationWebsite);
	}

	private static String normalizeSingleLine(String value) {
		return value == null ? null : value.strip();
	}

	private static String normalizeMessage(String value) {
		return value == null ? null : value.replace("\r\n", "\n").replace('\r', '\n').strip();
	}

}
