package fr.bwetterwald.portfolio.contact.config;

import fr.bwetterwald.portfolio.contact.application.ContactMessageSender;
import fr.bwetterwald.portfolio.contact.delivery.SmtpContactMessageSender;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ContactConfigurationTests {

	private final ContactConfiguration configuration = new ContactConfiguration();

	@Test
	void contactPropertiesUseTheSafeDefaultSubjectPrefix() {
		assertThat(new ContactProperties().getSubjectPrefix()).isEqualTo("[Contact Portfolio]");
	}

	@Test
	void smtpModeCreatesThePortableSenderWhenMandatoryConfigurationIsPresent() {
		ContactProperties properties = new ContactProperties();
		properties.setRecipient("owner@example.test");
		properties.setSender("Portfolio <sender@example.test>");
		JavaMailSender mailSender = mock(JavaMailSender.class);
		ObjectProvider<JavaMailSender> provider = provider(mailSender);
		MockEnvironment environment = smtpEnvironment();

		ContactMessageSender sender = this.configuration.smtpContactMessageSender(properties, provider, environment);

		assertThat(sender).isInstanceOf(SmtpContactMessageSender.class);
	}

	@Test
	void smtpModeFailsClearlyWhenPrivateIdentityOrConnectionConfigurationIsMissing() {
		ContactProperties missingRecipient = new ContactProperties();
		missingRecipient.setSender("Portfolio <sender@example.test>");

		assertThatThrownBy(() -> this.configuration.smtpContactMessageSender(missingRecipient,
				provider(mock(JavaMailSender.class)), smtpEnvironment()))
			.isInstanceOf(IllegalStateException.class)
			.hasMessageContaining("PORTFOLIO_CONTACT_RECIPIENT");

		ContactProperties configuredIdentities = new ContactProperties();
		configuredIdentities.setRecipient("owner@example.test");
		configuredIdentities.setSender("Portfolio <sender@example.test>");

		assertThatThrownBy(() -> this.configuration.smtpContactMessageSender(configuredIdentities,
				provider(mock(JavaMailSender.class)), new MockEnvironment()))
			.isInstanceOf(IllegalStateException.class)
			.hasMessageContaining("SPRING_MAIL_HOST");
	}

	@Test
	void smtpModeRejectsMalformedConfiguredIdentitiesWithoutEchoingTheirValue() {
		ContactProperties properties = new ContactProperties();
		properties.setRecipient("not-an-address");
		properties.setSender("Portfolio <sender@example.test>");

		assertThatThrownBy(() -> this.configuration.smtpContactMessageSender(properties,
				provider(mock(JavaMailSender.class)), smtpEnvironment()))
			.isInstanceOf(IllegalStateException.class)
			.hasMessage("PORTFOLIO_CONTACT_RECIPIENT must contain one valid email identity")
			.hasMessageNotContaining("not-an-address");
	}

	@Test
	void smtpModeRejectsHeaderInjectionInTheConfiguredSubjectPrefixWithoutEchoingItsValue() {
		ContactProperties properties = new ContactProperties();
		properties.setRecipient("owner@example.test");
		properties.setSender("Portfolio <sender@example.test>");
		properties.setSubjectPrefix("[Contact Portfolio]\r\nBcc: hidden@example.test");

		assertThatThrownBy(() -> this.configuration.smtpContactMessageSender(properties,
				provider(mock(JavaMailSender.class)), smtpEnvironment()))
			.isInstanceOf(IllegalStateException.class)
			.hasMessage("PORTFOLIO_CONTACT_SUBJECT_PREFIX must be a single line of at most 80 characters")
			.hasMessageNotContaining("hidden@example.test");
	}

	@SuppressWarnings("unchecked")
	private static ObjectProvider<JavaMailSender> provider(JavaMailSender mailSender) {
		ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);

		when(provider.getIfAvailable()).thenReturn(mailSender);
		return provider;
	}

	private static MockEnvironment smtpEnvironment() {
		return new MockEnvironment().withProperty("spring.mail.host", "smtp.example.test")
			.withProperty("spring.mail.port", "587")
			.withProperty("spring.mail.username", "smtp-user")
			.withProperty("spring.mail.password", "test-secret");
	}

}
