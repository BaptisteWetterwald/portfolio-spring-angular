package fr.bwetterwald.portfolio.common.error;

public record ApiErrorDto(int status, String code, String message) {
}
