/**
 * Infrastructure query options for repository queries.
 *
 * @remarks
 * These types encapsulate infrastructure concerns (pagination, caching)
 * that are required for repository interface definitions.
 *
 * While these are infrastructure-related concerns, they are placed in shared-kernel
 * for practical reasons: repository interfaces need to define their parameter types,
 * and separating these would break the dependency injection pattern.
 *
 * See DDD deviation 014 in docs/domain-model.md for architectural rationale.
 *
 * @module
 */

/**
 * Pagination parameters for repository queries.
 */
export type PaginationOptions = {
	/** Maximum number of results to return */
	take?: number;
	/** Number of results to skip (for pagination) */
	skip?: number;
};

/**
 * Cache strategy for Prisma Accelerate.
 *
 * @remarks
 * Provides fine-grained control over caching behavior.
 * Uses stale-while-revalidate (SWR) pattern for optimal performance.
 *
 * @example
 * ```typescript
 * const strategy: CacheStrategy = {
 *   ttl: 60,           // Cache for 60 seconds
 *   swr: 300,          // Serve stale for 5 minutes while revalidating
 *   tags: ["articles"] // Cache tags for invalidation
 * };
 * ```
 */
export type CacheStrategy = {
	/** Time-to-live in seconds */
	ttl?: number;
	/** Stale-while-revalidate duration in seconds */
	swr?: number;
	/** Cache tags for targeted invalidation */
	tags?: string[];
};

/**
 * Combined infrastructure query options.
 *
 * @remarks
 * Combines pagination and caching options for repository findMany operations.
 */
export type InfraQueryOptions = PaginationOptions & {
	/** Caching configuration for the query */
	cacheStrategy?: CacheStrategy;
};
