package fr.bwetterwald.portfolio.contact.application;

public class ContactDeliveryException extends RuntimeException {

	public ContactDeliveryException(Throwable cause) {
		super("Contact message delivery failed", cause);
	}

}
