package fr.bwetterwald.portfolio.common.error;

import fr.bwetterwald.portfolio.contact.application.ContactDeliveryException;
import fr.bwetterwald.portfolio.contact.application.ContactRateLimitExceededException;
import fr.bwetterwald.portfolio.contact.application.ContactUnavailableException;
import fr.bwetterwald.portfolio.project.application.ProjectNotFoundException;
import fr.bwetterwald.portfolio.project.application.UnsupportedProjectLocaleException;
import fr.bwetterwald.portfolio.project.application.UnsupportedPublicProjectStatusException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiExceptionHandler {

	@ExceptionHandler(ProjectNotFoundException.class)
	public ResponseEntity<ApiErrorDto> handleProjectNotFound(ProjectNotFoundException exception) {
		return apiError(HttpStatus.NOT_FOUND, "project_not_found", "Project not found.");
	}

	@ExceptionHandler(UnsupportedProjectLocaleException.class)
	public ResponseEntity<ApiErrorDto> handleUnsupportedProjectLocale(UnsupportedProjectLocaleException exception) {
		return apiError(HttpStatus.BAD_REQUEST, "unsupported_locale", "Supported locales are fr and en.");
	}

	@ExceptionHandler(UnsupportedPublicProjectStatusException.class)
	public ResponseEntity<ApiErrorDto> handleUnsupportedProjectStatus(UnsupportedPublicProjectStatusException exception) {
		return apiError(HttpStatus.BAD_REQUEST, "invalid_project_status",
				"Supported public project status filters are PUBLISHED and ARCHIVED.");
	}

	@ExceptionHandler({
			ConstraintViolationException.class,
			MethodArgumentNotValidException.class,
			HttpMessageNotReadableException.class,
			MethodArgumentTypeMismatchException.class,
			MissingServletRequestParameterException.class })
	public ResponseEntity<ApiErrorDto> handleBadRequest(Exception exception) {
		return apiError(HttpStatus.BAD_REQUEST, "bad_request", "The request is invalid.");
	}

	@ExceptionHandler(ContactRateLimitExceededException.class)
	public ResponseEntity<ApiErrorDto> handleContactRateLimit(ContactRateLimitExceededException exception) {
		return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
			.header(HttpHeaders.RETRY_AFTER, Long.toString(exception.retryAfterSeconds()))
			.body(new ApiErrorDto(HttpStatus.TOO_MANY_REQUESTS.value(), "contact_rate_limited",
					"Too many contact requests. Please try again later."));
	}

	@ExceptionHandler(ContactUnavailableException.class)
	public ResponseEntity<ApiErrorDto> handleContactUnavailable(ContactUnavailableException exception) {
		return apiError(HttpStatus.SERVICE_UNAVAILABLE, "contact_unavailable",
				"Contact delivery is temporarily unavailable.");
	}

	@ExceptionHandler(ContactDeliveryException.class)
	public ResponseEntity<ApiErrorDto> handleContactDelivery(ContactDeliveryException exception) {
		return apiError(HttpStatus.BAD_GATEWAY, "contact_delivery_failed",
				"The contact message could not be delivered.");
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiErrorDto> handleUnexpected(Exception exception) {
		return apiError(HttpStatus.INTERNAL_SERVER_ERROR, "internal_error", "An unexpected error occurred.");
	}

	private static ResponseEntity<ApiErrorDto> apiError(HttpStatus status, String code, String message) {
		return ResponseEntity.status(status).body(new ApiErrorDto(status.value(), code, message));
	}

}
