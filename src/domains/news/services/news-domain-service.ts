import "server-only";
import { DomainError, Result } from "@/domains/common/value-objects";
import type {
	ICategoryCommandRepository,
	ICategoryQueryRepository,
	INewsCommandRepository,
	INewsQueryRepository,
	NewsDomainDeps,
} from "@/domains/news/types";
import {
	type CategoryAggregate,
	CategoryEntity,
	type NewsAggregate,
	NewsEntity,
	type UserId,
} from "../entities/news-entity";
import { CategoryName, NewsUrl } from "../value-objects";

// Use the shared dependency type from types.ts

export type NewsDomainServiceReader<T> = (
	deps: NewsDomainDeps,
) => Promise<Result<T, DomainError>>;

// Pure domain functions
export const newsDomainOperations = {
	validateNewNews: async (
		formData: FormData,
		userId: UserId,
		deps: NewsDomainDeps,
	): Promise<Result<NewsAggregate, DomainError>> => {
		// First, get or create category
		const categoryName = formData.get("category") as string;
		const categoryResult = await getOrCreateCategory(
			categoryName,
			userId,
			deps,
		);
		if (categoryResult.isFailure) {
			return categoryResult;
		}

		// Parse form data into domain object
		const newsDataResult = NewsEntity.fromFormData(
			formData,
			userId,
			categoryResult.value,
		);
		if (newsDataResult.isFailure) {
			return newsDataResult;
		}

		// Check for duplicates
		const url = newsDataResult.value.url;
		const duplicateCheckResult = await checkUrlDuplicate(url, userId, deps);
		if (duplicateCheckResult.isFailure) {
			return duplicateCheckResult;
		}

		// Create news entity
		return NewsEntity.create(newsDataResult.value);
	},

	updateNewsStatus: (
		news: NewsAggregate,
		newStatus: "UNEXPORTED" | "EXPORTED",
	): Result<NewsAggregate, DomainError> => {
		if (news.status === newStatus) {
			return Result.failure(
				DomainError.businessRule(
					"News is already in the requested status",
					"status_unchanged",
					{ currentStatus: news.status, requestedStatus: newStatus },
				),
			);
		}

		return Result.success(NewsEntity.updateStatus(news, newStatus));
	},

	enrichWithOpenGraphData: async (
		news: NewsAggregate,
		openGraphData: any,
	): Promise<Result<NewsAggregate, DomainError>> => {
		// Open Graph scraping logic would go here
		// For now, just return the news unchanged
		return Result.success(news);
	},

	assignToCategory: async (
		news: NewsAggregate,
		categoryName: string,
		userId: UserId,
		deps: NewsDomainDeps,
	): Promise<Result<NewsAggregate, DomainError>> => {
		const categoryResult = await getOrCreateCategory(
			categoryName,
			userId,
			deps,
		);
		if (categoryResult.isFailure) {
			return categoryResult;
		}

		return Result.success(
			NewsEntity.assignToCategory(news, categoryResult.value),
		);
	},
};

// Helper functions
const getOrCreateCategory = async (
	categoryName: string,
	userId: UserId,
	deps: NewsDomainDeps,
): Promise<Result<CategoryAggregate, DomainError>> => {
	// For now, just create a new category
	// In a real implementation, you'd check if it exists first
	const categoryDataResult = CategoryEntity.fromFormData(categoryName, userId);
	if (categoryDataResult.isFailure) {
		return categoryDataResult;
	}

	return CategoryEntity.create(categoryDataResult.value);
};

const checkUrlDuplicate = async (
	url: NewsUrl,
	userId: UserId,
	deps: NewsDomainDeps,
): Promise<Result<void, DomainError>> => {
	const existingNewsResult = await deps.newsQueryRepository.findByUrl(
		url,
		userId,
	);

	if (existingNewsResult.isFailure) {
		return Result.failure(existingNewsResult.error);
	}

	if (existingNewsResult.value !== null) {
		return Result.failure(
			DomainError.duplicate(
				"A news item with this URL already exists",
				"news",
				NewsUrl.unwrap(url),
			),
		);
	}

	return Result.success(undefined);
};

// Pipeline composition functions
export const newsProcessingPipelines = {
	createNewNews:
		(deps: NewsDomainDeps) =>
		async (
			formData: FormData,
			userId: UserId,
		): Promise<Result<NewsAggregate, DomainError>> => {
			return newsDomainOperations.validateNewNews(formData, userId, deps);
		},

	processNewsUpdate:
		(deps: NewsDomainDeps) =>
		async (
			newsId: string,
			updateData: Partial<NewsAggregate>,
		): Promise<Result<NewsAggregate, DomainError>> => {
			// Implementation would fetch existing news and apply updates
			// This is a placeholder for the pattern
			return Result.failure(
				DomainError.businessRule("Not implemented", "not_implemented"),
			);
		},
};
