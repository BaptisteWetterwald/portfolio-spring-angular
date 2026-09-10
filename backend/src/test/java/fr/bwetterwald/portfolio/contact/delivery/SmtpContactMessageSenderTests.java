package fr.bwetterwald.portfolio.contact.delivery;

import java.util.Properties;

import fr.bwetterwald.portfolio.contact.application.ContactDeliveryException;
import fr.bwetterwald.portfolio.contact.application.ContactMessage;
import jakarta.mail.Message;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SmtpContactMessageSenderTests {

	@Test
	void buildsPlainTextMailWithFixedIdentitiesAndVisitorReplyTo() throws Exception {
		JavaMailSender mailSender = mock(JavaMailSender.class);
		MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
		when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
		SmtpContactMessageSender sender = new SmtpContactMessageSender(mailSender, "owner@example.test",
				"Portfolio <sender@example.test>", "[Contact Portfolio]");

		sender.send(new ContactMessage("Portfolio SMTP Test", "portfolio.smtp.test@example.com", "M11 Gmail SMTP test",
				"End-to-end Gmail SMTP delivery test for the portfolio contact form."));
		mimeMessage.saveChanges();

		verify(mailSender).send(mimeMessage);
		assertThat(mimeMessage.getFrom()).containsExactly(new InternetAddress("Portfolio <sender@example.test>"));
		assertThat(mimeMessage.getRecipients(Message.RecipientType.TO))
			.containsExactly(new InternetAddress("owner@example.test"));
		assertThat(mimeMessage.getReplyTo())
			.containsExactly(new InternetAddress("portfolio.smtp.test@example.com"));
		assertThat(mimeMessage.getSubject()).isEqualTo("[Contact Portfolio] M11 Gmail SMTP test");
		assertThat(mimeMessage.getContentType()).startsWith("text/plain");
		assertThat(mimeMessage.getContent().toString())
			.contains("Name: Portfolio SMTP Test", "Email: portfolio.smtp.test@example.com",
					"End-to-end Gmail SMTP delivery test for the portfolio contact form.");
	}

	@Test
	void convertsMailFailuresToTheControlledDeliveryException() {
		JavaMailSender mailSender = mock(JavaMailSender.class);
		MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
		when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
		doThrow(new MailSendException("provider details")).when(mailSender).send(mimeMessage);
		SmtpContactMessageSender sender = new SmtpContactMessageSender(mailSender, "owner@example.test",
				"Portfolio <sender@example.test>", "[Contact Portfolio]");

		assertThatThrownBy(() -> sender.send(new ContactMessage("Ada", "ada@example.test", "Project",
				"A message that is comfortably long enough.")))
			.isInstanceOf(ContactDeliveryException.class)
			.hasMessage("Contact message delivery failed");
	}

}
