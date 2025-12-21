import { ZodError } from "zod";
import {
	InvalidFormatError,
	UnexpectedError,
} from "../../errors/error-classes";

/**
 * Wraps entity creation with standardized error handling.
 *
 * @remarks
 * This utility function provides consistent error handling across all entity factories.
 * It catches Zod validation errors and converts them to domain-specific error types.
 *
 * @typeParam T - The type of entity being created
 * @param factory - A function that creates the entity
 * @returns The created entity
 * @throws {InvalidFormatError} When Zod validation fails
 * @throws {UnexpectedError} For any other unexpected errors
 *
 * @example
 * ```typescript
 * const article = createEntityWithErrorHandling(() =>
 *   Object.freeze({
 *     id: makeId(),
 *     title: makeArticleTitle(rawTitle),
 *     // ... other fields
 *   })
 * );
 * ```
 *
 * @see {@link InvalidFormatError} for validation error handling
 * @see {@link UnexpectedError} for unexpected error handling
 */
export const createEntityWithErrorHandling = <T>(factory: () => T): T => {
	try {
		return factory();
	} catch (error) {
		if (error instanceof ZodError) throw new InvalidFormatError();
		throw new UnexpectedError();
	}
};
