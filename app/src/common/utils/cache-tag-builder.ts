import type { Status } from "@s-hirano-ist/s-core/common/entities/common-entity";

type Domain = "books" | "articles" | "notes" | "images";

export function buildContentCacheTag(
	domain: Domain,
	status: Status,
	userId: string,
): string {
	return `${domain}_${status}_${userId}`;
}

export function buildCountCacheTag(
	domain: Domain,
	status: Status,
	userId: string,
): string {
	return `${domain}_count_${status}_${userId}`;
}
