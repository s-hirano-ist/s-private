import type { Status } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/infrastructures/shared/cache/cache-tag-builder";
import { revalidateTag } from "next/cache";

export const CACHE_INVALIDATION_DOMAINS = [
	"articles",
	"books",
	"images",
	"notes",
] as const;

export type CacheInvalidationDomain =
	(typeof CACHE_INVALIDATION_DOMAINS)[number];

const CONTENT_STATUSES = [
	"UNEXPORTED",
	"LAST_UPDATED",
	"EXPORTED",
] as const satisfies readonly Status[];

/**
 * Invalidates every status bucket affected by a batch status transition.
 *
 * Paginated queries also carry the non-paginated content tag, so invalidating
 * that shared tag covers every page without enumerating pagination offsets.
 */
export function invalidateContentStatusCache(
	domain: CacheInvalidationDomain,
	userId: string,
): string[] {
	const tags = CONTENT_STATUSES.flatMap((status) => [
		buildContentCacheTag(domain, status, userId),
		buildCountCacheTag(domain, status, userId),
	]);

	for (const tag of tags) {
		revalidateTag(tag, { expire: 0 });
	}

	return tags;
}
