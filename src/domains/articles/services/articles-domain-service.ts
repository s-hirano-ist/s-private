import "server-only";
import { DuplicateError } from "@/common/error/error-classes";
import type { IArticlesQueryRepository } from "@/domains/articles/repositories/articles-query-repository.interface";
import type { UserId } from "@/domains/common/entities/common-entity";
import type { Url } from "../entities/article-entity";

async function ensureNoDuplicateArticle(
	articlesQueryRepository: IArticlesQueryRepository,
	url: Url,
	userId: UserId,
): Promise<void> {
	const exists = await articlesQueryRepository.findByUrl(url, userId);
	if (exists !== null) {
		throw new DuplicateError();
	}
}

export class ArticlesDomainService {
	constructor(
		private readonly articlesQueryRepository: IArticlesQueryRepository,
	) {}

	public async ensureNoDuplicate(url: Url, userId: UserId): Promise<void> {
		return ensureNoDuplicateArticle(this.articlesQueryRepository, url, userId);
	}
}
