package fr.bwetterwald.portfolio.contact.application;

@FunctionalInterface
public interface ContactMessageSender {

	void send(ContactMessage message);

}
