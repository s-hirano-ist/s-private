/**
 * Common type definitions for server actions and data fetching.
 *
 * @module
 */

/**
 * Standard server action response type.
 *
 * @remarks
 * Used for all server action return values with success/failure status.
 */
export type ServerAction = {
	/** Translated message key for toast notifications */
	message: string;
	/** Whether the action completed successfully */
	success: boolean;
	/** Preserved form data for retry on failure */
	formData?: Record<string, string>;
};

/**
 * Server action response with additional data payload.
 */
export type ServerActionWithData<T> = ServerAction & {
	/** Optional data returned on success */
	data?: T;
};

/**
 * Delete action function signature.
 */
export type DeleteAction = (id: string) => Promise<ServerAction>;

/**
 * Load more action for infinite scroll pagination.
 */
export type LoadMoreAction<T> = (
	currentCount: number,
) => Promise<ServerActionWithData<T>>;

/**
 * Function type for getting total count.
 */
export type GetCount = () => Promise<number>;

/**
 * Function type for fetching paginated data.
 */
export type GetPaginatedData<T> = (currentCount: number) => Promise<T>;
