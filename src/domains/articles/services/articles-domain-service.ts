import "server-only";
import { DuplicateError } from "@/common/error/error-classes";
import type { IArticlesQueryRepository } from "@/domains/articles/repositories/articles-query-repository.interface";
import type { UserId } from "@/domains/common/entities/common-entity";
import type { Url } from "../entities/article-entity";

export class ArticlesDomainService {
	constructor(
		private readonly articlesQueryRepository: IArticlesQueryRepository,
	) {}

	public async ensureNoDuplicate(url: Url, userId: UserId): Promise<void> {
		const exists = await this.articlesQueryRepository.findByUrl(url, userId);
		if (exists !== null) {
			throw new DuplicateError();
		}
	}
}
