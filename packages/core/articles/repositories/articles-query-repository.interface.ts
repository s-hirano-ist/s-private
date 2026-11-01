import type { Url } from "@s-hirano-ist/s-core/articles/entities/article-entity";
import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
/** Domain duplication checks need existence, not a reconstructed content lifecycle. */
export type IArticlesQueryRepository = {
	existsByUrl(key: Url, userId: UserId): Promise<boolean>;
};
