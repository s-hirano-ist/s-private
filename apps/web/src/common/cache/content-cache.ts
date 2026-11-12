import "server-only";
import { cacheLife, cacheTag } from "next/cache";

export type ContentDomain = "articles" | "notes" | "images" | "books";

export function contentCacheTag(domain: ContentDomain): string {
	return `content:${domain}`;
}

/** Called only from a private cache scope; production reuse stays in browser memory. */
export function configureContentCache(domain: ContentDomain): void {
	cacheLife({ stale: 60 });
	cacheTag(contentCacheTag(domain));
}
