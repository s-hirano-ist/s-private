import "server-only";
import { DuplicateError } from "@/common/error/error-classes";
import type { INewsQueryRepository } from "@/domains/news/types";
import { CategoryEntity } from "../entities/category.entity";
import { NewsEntity } from "../entities/news.entity";
import { NewsUrl } from "../value-objects/news-url";
import { NewsTitle } from "../value-objects/news-title";

export class NewsDomainService {
	constructor(private readonly newsQueryRepository: INewsQueryRepository) {}


	// Improved domain service methods using entities and value objects
	public async validateDuplicateNews(
		url: NewsUrl,
		userId: string,
	): Promise<void> {
		const exists = await this.newsQueryRepository.findByUrl(
			url.toString(),
			userId,
		);
		if (exists !== null) throw new DuplicateError();
	}

	public createCategory(params: {
		name: string;
		userId: string;
	}): CategoryEntity {
		return CategoryEntity.create({
			id: "", // IDジェネレーターで生成される
			name: params.name,
			userId: params.userId,
		});
	}

	public createNewNews(params: {
		title: string;
		url: string;
		quote?: string | null;
		category: CategoryEntity;
		userId: string;
	}): NewsEntity {
		// CategoryのユーザーIDチェック
		if (!params.category.belongsToUser(params.userId)) {
			throw new Error("Category does not belong to the same user");
		}

		return NewsEntity.create({
			id: "", // IDジェネレーターで生成される
			title: params.title,
			url: params.url,
			quote: params.quote ?? null,
			category: params.category.toRepository(),
			userId: params.userId,
			status: "UNEXPORTED",
			ogTitle: null,
			ogDescription: null,
		});
	}

	public async validateAndCreateNews(params: {
		title: string;
		url: string;
		quote?: string | null;
		categoryName: string;
		userId: string;
	}): Promise<NewsEntity> {
		// Create Value Objects (throws if invalid)
		const url = NewsUrl.create(params.url);
		const title = NewsTitle.create(params.title);

		// Check for duplicate
		await this.validateDuplicateNews(url, params.userId);

		// Create category
		const category = this.createCategory({
			name: params.categoryName,
			userId: params.userId,
		});

		// Create and return news entity
		return this.createNewNews({
			title: params.title,
			url: params.url,
			quote: params.quote,
			category,
			userId: params.userId,
		});
	}
}
