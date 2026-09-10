package fr.bwetterwald.portfolio.contact.application;

public class ContactUnavailableException extends RuntimeException {

	public ContactUnavailableException() {
		super("Contact delivery is unavailable");
	}

}
