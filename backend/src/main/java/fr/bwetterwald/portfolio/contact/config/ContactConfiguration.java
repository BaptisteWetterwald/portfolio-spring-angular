package fr.bwetterwald.portfolio.contact.config;

import java.time.Duration;

import fr.bwetterwald.portfolio.contact.abuse.ContactRateLimiter;
import fr.bwetterwald.portfolio.contact.application.ContactMessageSender;
import fr.bwetterwald.portfolio.contact.delivery.DisabledContactMessageSender;
import fr.bwetterwald.portfolio.contact.delivery.LoggingContactMessageSender;
import fr.bwetterwald.portfolio.contact.delivery.SmtpContactMessageSender;
import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.util.StringUtils;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(ContactProperties.class)
public class ContactConfiguration {

	@Bean
	ContactRateLimiter contactRateLimiter(ContactProperties properties) {
		ContactProperties.RateLimit rateLimit = properties.getRateLimit();

		return new ContactRateLimiter(rateLimit.getMaxSubmissions(), rateLimit.getWindow(), rateLimit.getMaxClients());
	}

	@Bean
	@ConditionalOnProperty(prefix = "portfolio.contact", name = "delivery-mode", havingValue = "log",
			matchIfMissing = true)
	ContactMessageSender loggingContactMessageSender() {
		return new LoggingContactMessageSender();
	}

	@Bean
	@ConditionalOnProperty(prefix = "portfolio.contact", name = "delivery-mode", havingValue = "disabled")
	ContactMessageSender disabledContactMessageSender() {
		return new DisabledContactMessageSender();
	}

	@Bean
	@ConditionalOnProperty(prefix = "portfolio.contact", name = "delivery-mode", havingValue = "smtp")
	ContactMessageSender smtpContactMessageSender(ContactProperties properties,
			ObjectProvider<JavaMailSender> mailSenderProvider, Environment environment) {
		String recipient = requireAddress("PORTFOLIO_CONTACT_RECIPIENT", properties.getRecipient());
		String sender = requireAddress("PORTFOLIO_CONTACT_SENDER", properties.getSender());
		String subjectPrefix = requireSubjectPrefix(properties.getSubjectPrefix());

		requireSetting(environment, "spring.mail.host", "SPRING_MAIL_HOST");
		requireSetting(environment, "spring.mail.port", "SPRING_MAIL_PORT");
		requireSetting(environment, "spring.mail.username", "SPRING_MAIL_USERNAME");
		requireSetting(environment, "spring.mail.password", "SPRING_MAIL_PASSWORD");

		JavaMailSender mailSender = mailSenderProvider.getIfAvailable();

		if (mailSender == null) {
			throw new IllegalStateException("SMTP contact delivery requires a configured Spring JavaMailSender");
		}

		return new SmtpContactMessageSender(mailSender, recipient, sender, subjectPrefix);
	}

	private static String requireAddress(String variableName, String value) {
		if (!StringUtils.hasText(value)) {
			throw new IllegalStateException(variableName + " is required when contact delivery mode is smtp");
		}

		try {
			InternetAddress address = new InternetAddress(value, true);

			address.validate();
		}
		catch (AddressException ignored) {
			throw new IllegalStateException(variableName + " must contain one valid email identity");
		}

		return value;
	}

	private static String requireSubjectPrefix(String value) {
		if (!StringUtils.hasText(value)) {
			throw new IllegalStateException(
					"PORTFOLIO_CONTACT_SUBJECT_PREFIX is required when contact delivery mode is smtp");
		}
		if (value.length() > 80 || value.indexOf('\r') >= 0 || value.indexOf('\n') >= 0 || value.indexOf('\0') >= 0) {
			throw new IllegalStateException(
					"PORTFOLIO_CONTACT_SUBJECT_PREFIX must be a single line of at most 80 characters");
		}

		return value;
	}

	private static void requireSetting(Environment environment, String propertyName, String variableName) {
		if (!StringUtils.hasText(environment.getProperty(propertyName))) {
			throw new IllegalStateException(variableName + " is required when contact delivery mode is smtp");
		}
	}

}
