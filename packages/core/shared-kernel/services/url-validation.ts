/**
 * URL validation utilities for value objects.
 *
 * @remarks
 * Provides shared URL validation logic for use across multiple domains.
 * Used by articles (OgImageUrl, Url) and books (GoogleImgSrc, GoogleHref).
 *
 * @module
 */

/**
 * Validates that a URL string uses HTTP or HTTPS protocol.
 *
 * @remarks
 * Returns true for empty/falsy values to support nullable fields.
 * This allows nullable URL value objects to pass validation when null/undefined.
 *
 * @param url - The URL string to validate
 * @returns true if the URL is valid HTTP/HTTPS or falsy, false otherwise
 *
 * @example
 * ```typescript
 * isValidHttpUrl("https://example.com"); // true
 * isValidHttpUrl("http://example.com");  // true
 * isValidHttpUrl("ftp://example.com");   // false
 * isValidHttpUrl("");                     // true (supports nullable)
 * isValidHttpUrl(null as unknown as string); // true (supports nullable)
 * ```
 */
export const isValidHttpUrl = (url: string): boolean => {
	if (!url) return true;
	try {
		const urlObject = new URL(url);
		return urlObject.protocol === "http:" || urlObject.protocol === "https:";
	} catch {
		return false;
	}
};
