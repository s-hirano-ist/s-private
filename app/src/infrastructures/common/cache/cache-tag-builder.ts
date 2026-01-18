/**
 * Cache tag builders for Next.js cache invalidation.
 *
 * @remarks
 * Generates consistent cache tags for content and count queries.
 * Used with revalidateTag() for targeted cache invalidation.
 *
 * @module
 */

import type { Status } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";

/** Content domain types for cache tagging */
type Domain = "books" | "articles" | "notes" | "images";

/**
 * Builds a cache tag for content list queries.
 *
 * @param domain - Content domain (books, articles, notes, images)
 * @param status - Content status (UNEXPORTED/EXPORTED)
 * @param userId - User ID for data isolation
 * @returns Cache tag string in format `{domain}_{status}_{userId}`
 */
export function buildContentCacheTag(
	domain: Domain,
	status: Status,
	userId: string,
): string {
	return `${domain}_${status}_${userId}`;
}

/**
 * Builds a cache tag for count queries.
 *
 * @param domain - Content domain (books, articles, notes, images)
 * @param status - Content status (UNEXPORTED/EXPORTED)
 * @param userId - User ID for data isolation
 * @returns Cache tag string in format `{domain}_count_{status}_{userId}`
 */
export function buildCountCacheTag(
	domain: Domain,
	status: Status,
	userId: string,
): string {
	return `${domain}_count_${status}_${userId}`;
}
