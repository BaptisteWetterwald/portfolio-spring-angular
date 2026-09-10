package fr.bwetterwald.portfolio.contact.delivery;

import fr.bwetterwald.portfolio.contact.application.ContactMessage;
import fr.bwetterwald.portfolio.contact.application.ContactMessageSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LoggingContactMessageSender implements ContactMessageSender {

	private static final Logger LOGGER = LoggerFactory.getLogger(LoggingContactMessageSender.class);

	@Override
	public void send(ContactMessage message) {
		LOGGER.info("Development contact message accepted (subjectLength={}, messageLength={})",
				message.subject().length(), message.message().length());
	}

}
