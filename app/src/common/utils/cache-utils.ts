/**
 * Sanitizes a user ID for use in cache tags.
 * Only allows alphabetic characters (a-z, A-Z) and underscores.
 * Removes all other characters to ensure cache tag compatibility.
 *
 * @param userId - The user ID to sanitize
 * @returns The sanitized user ID containing only alphabets and underscores
 */
export function sanitizeCacheTag(userId: string): string {
	return userId.replaceAll(/[^a-zA-Z_]/g, "");
}
