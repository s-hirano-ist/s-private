/**
 * @packageDocumentation
 *
 * Domain-specific error classes for error handling.
 *
 * @remarks
 * Provides typed error classes for common domain scenarios:
 *
 * - **UnexpectedError** - For unexpected runtime errors
 * - **InvalidFormatError** - For validation failures
 * - **DuplicateError** - For uniqueness constraint violations
 * - **FileNotAllowedError** - For forbidden file types
 *
 * All error classes extend the base Error class and include
 * descriptive messages for logging and user feedback.
 *
 * @example
 * ```typescript
 * import { DuplicateError, InvalidFormatError } from "@repo/core/errors";
 *
 * if (exists) {
 *   throw new DuplicateError("Article already exists");
 * }
 *
 * if (!isValid) {
 *   throw new InvalidFormatError("Invalid ISBN format");
 * }
 * ```
 */

// Error classes
export * from "./error-classes.js";
