/**
 * Cache configuration for repository queries.
 *
 * @remarks
 * Provides fine-grained control over caching behavior.
 * Uses stale-while-revalidate (SWR) pattern for optimal performance.
 *
 * @example
 * ```typescript
 * const strategy: CacheStrategy = {
 *   ttl: 60,         // Cache for 60 seconds
 *   swr: 300,        // Serve stale for 5 minutes while revalidating
 *   tags: ["images"] // Cache tags for invalidation
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
