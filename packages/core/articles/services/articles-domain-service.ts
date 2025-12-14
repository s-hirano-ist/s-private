import type { UserId } from "../../common/entities/common-entity";
import { DuplicateError } from "../../errors/error-classes";
import type { Url } from "../entities/article-entity";
import type { IArticlesQueryRepository } from "../repositories/articles-query-repository.interface";

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

	public async ensureNoDuplicate(url: Url, userId: UserId) {
		return ensureNoDuplicateArticle(this.articlesQueryRepository, url, userId);
	}
}
