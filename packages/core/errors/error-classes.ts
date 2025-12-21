/**
 * Error thrown when an unexpected error occurs.
 *
 * @remarks
 * Used as a catch-all for errors that shouldn't happen under normal conditions.
 * The message "unexpected" can be used for i18n lookups.
 *
 * @example
 * ```typescript
 * try {
 *   // Some operation that should never fail
 * } catch (error) {
 *   throw new UnexpectedError();
 * }
 * ```
 *
 * @see {@link InvalidFormatError} for validation errors
 * @see {@link DuplicateError} for uniqueness constraint violations
 */
export class UnexpectedError extends Error {
	constructor() {
		super("unexpected");
		this.name = "UnexpectedError";
	}
}

/**
 * Error thrown when input validation fails.
 *
 * @remarks
 * Used by domain entities when Zod validation fails.
 * The message "invalidFormat" can be used for i18n lookups.
 *
 * @example
 * ```typescript
 * // In entity factory
 * try {
 *   return ArticleTitle.parse(value);
 * } catch (zodError) {
 *   throw new InvalidFormatError();
 * }
 * ```
 *
 * @see {@link UnexpectedError} for unexpected errors
 * @see {@link DuplicateError} for uniqueness constraint violations
 */
export class InvalidFormatError extends Error {
	constructor() {
		super("invalidFormat");
		this.name = "InvalidFormatError";
	}
}

/**
 * Error thrown when a duplicate entity is detected.
 *
 * @remarks
 * Used by domain services to enforce uniqueness constraints.
 * The message "duplicate" can be used for i18n lookups.
 *
 * @example
 * ```typescript
 * // In domain service
 * if (await repository.exists(key)) {
 *   throw new DuplicateError();
 * }
 *
 * // In application service
 * try {
 *   await domainService.ensureNoDuplicate(key, userId);
 * } catch (error) {
 *   if (error instanceof DuplicateError) {
 *     return { success: false, message: t("errors.duplicate") };
 *   }
 * }
 * ```
 *
 * @see {@link InvalidFormatError} for validation errors
 * @see {@link UnexpectedError} for unexpected errors
 */
export class DuplicateError extends Error {
	constructor() {
		super("duplicate");
		this.name = "DuplicateError";
	}
}

/**
 * Error thrown when a file type is not allowed.
 *
 * @remarks
 * Used by the images domain when an unsupported file format is uploaded.
 * The message "invalidFileFormat" can be used for i18n lookups.
 *
 * @example
 * ```typescript
 * const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
 * if (!allowedTypes.includes(file.type)) {
 *   throw new FileNotAllowedError();
 * }
 * ```
 *
 * @see {@link InvalidFormatError} for general validation errors
 */
export class FileNotAllowedError extends Error {
	constructor() {
		super("invalidFileFormat");
		this.name = "FileNotAllowedError";
	}
}
