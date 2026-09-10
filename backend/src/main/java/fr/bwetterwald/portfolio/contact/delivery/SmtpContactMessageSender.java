package fr.bwetterwald.portfolio.contact.delivery;

import java.nio.charset.StandardCharsets;

import fr.bwetterwald.portfolio.contact.application.ContactDeliveryException;
import fr.bwetterwald.portfolio.contact.application.ContactMessage;
import fr.bwetterwald.portfolio.contact.application.ContactMessageSender;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

public class SmtpContactMessageSender implements ContactMessageSender {

	private final JavaMailSender mailSender;

	private final String recipient;

	private final String sender;

	private final String subjectPrefix;

	public SmtpContactMessageSender(JavaMailSender mailSender, String recipient, String sender, String subjectPrefix) {
		this.mailSender = mailSender;
		this.recipient = recipient;
		this.sender = sender;
		this.subjectPrefix = subjectPrefix;
	}

	@Override
	public void send(ContactMessage message) {
		try {
			MimeMessage mimeMessage = this.mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, StandardCharsets.UTF_8.name());

			helper.setValidateAddresses(true);
			helper.setFrom(this.sender);
			helper.setTo(this.recipient);
			helper.setReplyTo(message.email());
			helper.setSubject(this.subjectPrefix + " " + message.subject());
			helper.setText(toPlainText(message), false);

			this.mailSender.send(mimeMessage);
		}
		catch (MailException | MessagingException exception) {
			throw new ContactDeliveryException(exception);
		}
	}

	private static String toPlainText(ContactMessage message) {
		return """
				A contact message was submitted through the portfolio.

				Name: %s
				Email: %s
				Subject: %s

				Message:
				%s
				""".formatted(message.name(), message.email(), message.subject(), message.message());
	}

}
