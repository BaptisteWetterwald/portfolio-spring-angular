package fr.bwetterwald.portfolio.contact.delivery;

import fr.bwetterwald.portfolio.contact.application.ContactMessage;
import fr.bwetterwald.portfolio.contact.application.ContactMessageSender;
import fr.bwetterwald.portfolio.contact.application.ContactUnavailableException;

public class DisabledContactMessageSender implements ContactMessageSender {

	@Override
	public void send(ContactMessage message) {
		throw new ContactUnavailableException();
	}

}
