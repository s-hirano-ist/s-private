import { DomainError, Result } from "@/domains/common/value-objects";
import type {
	CategoryAggregate,
	CategoryId,
	NewsAggregate,
	NewsId,
	NewsStatus,
	OpenGraphMetadata,
	UserId,
} from "@/domains/news/entities/news-entity";
import type {
	CategoryFindManyParams,
	ICategoryQueryRepository,
	INewsQueryRepository,
	NewsFindManyParams,
} from "@/domains/news/types";
import {
	CategoryName,
	NewsQuote,
	NewsTitle,
	NewsUrl,
} from "@/domains/news/value-objects";
import prisma from "@/prisma";

// Helper function to map Prisma result to domain aggregate
const mapPrismaToNewsAggregate = (prismaNews: any): NewsAggregate => {
	const titleResult = NewsTitle.safeParse(prismaNews.title);
	const urlResult = NewsUrl.safeParse(prismaNews.url);
	const quoteResult = NewsQuote.safeParse(prismaNews.quote);
	const categoryNameResult = CategoryName.safeParse(prismaNews.Category.name);

	if (
		!titleResult.success ||
		!urlResult.success ||
		!quoteResult.success ||
		!categoryNameResult.success
	) {
		throw new Error("Invalid data from database");
	}

	const openGraphMetadata: OpenGraphMetadata | undefined =
		prismaNews.ogTitle || prismaNews.ogDescription
			? {
					title: prismaNews.ogTitle,
					description: prismaNews.ogDescription,
					imageUrl: undefined,
				}
			: undefined;

	return {
		id: prismaNews.id,
		title: titleResult.data,
		url: urlResult.data,
		quote: quoteResult.data,
		category: {
			id: prismaNews.Category.id,
			name: categoryNameResult.data,
			userId: prismaNews.userId,
			createdAt: prismaNews.Category.createdAt,
			updatedAt: prismaNews.Category.updatedAt,
		},
		userId: prismaNews.userId,
		status: prismaNews.status,
		openGraphMetadata,
		createdAt: prismaNews.createdAt,
		updatedAt: prismaNews.updatedAt,
		exportedAt: prismaNews.exportedAt,
	};
};

const mapPrismaToCategoryAggregate = (
	prismaCategory: any,
): CategoryAggregate => {
	const nameResult = CategoryName.safeParse(prismaCategory.name);

	if (!nameResult.success) {
		throw new Error("Invalid category name from database");
	}

	return {
		id: prismaCategory.id,
		name: nameResult.data,
		userId: prismaCategory.userId,
		createdAt: prismaCategory.createdAt,
		updatedAt: prismaCategory.updatedAt,
	};
};

// Functional news query repository
export const newsQueryRepository: INewsQueryRepository = {
	findById: async (
		id: NewsId,
		userId: UserId,
	): Promise<Result<NewsAggregate | null, DomainError>> => {
		try {
			const prismaNews = await prisma.news.findUnique({
				where: { id, userId },
				include: {
					Category: true,
				},
			});

			if (!prismaNews) {
				return Result.success(null);
			}

			const newsAggregate = mapPrismaToNewsAggregate(prismaNews);
			return Result.success(newsAggregate);
		} catch (error) {
			return Result.failure(
				DomainError.infrastructure("Failed to find news by ID", "database", {
					cause: error,
				}),
			);
		}
	},

	findByUrl: async (
		url: NewsUrl,
		userId: UserId,
	): Promise<Result<NewsAggregate | null, DomainError>> => {
		try {
			const prismaNews = await prisma.news.findUnique({
				where: {
					url_userId: {
						url: NewsUrl.unwrap(url),
						userId,
					},
				},
				include: {
					Category: true,
				},
			});

			if (!prismaNews) {
				return Result.success(null);
			}

			const newsAggregate = mapPrismaToNewsAggregate(prismaNews);
			return Result.success(newsAggregate);
		} catch (error) {
			return Result.failure(
				DomainError.infrastructure("Failed to find news by URL", "database", {
					cause: error,
				}),
			);
		}
	},

	findMany: async (
		userId: UserId,
		status: NewsStatus,
		params?: NewsFindManyParams,
	): Promise<Result<NewsAggregate[], DomainError>> => {
		try {
			const prismaNews = await prisma.news.findMany({
				where: { userId, status },
				include: {
					Category: true,
				},
				orderBy: params?.orderBy || { createdAt: "desc" },
				take: params?.take,
				skip: params?.skip,
			});

			const newsAggregates = prismaNews.map(mapPrismaToNewsAggregate);
			return Result.success(newsAggregates);
		} catch (error) {
			return Result.failure(
				DomainError.infrastructure("Failed to find news", "database", {
					cause: error,
				}),
			);
		}
	},

	count: async (
		userId: UserId,
		status: NewsStatus,
	): Promise<Result<number, DomainError>> => {
		try {
			const count = await prisma.news.count({
				where: { userId, status },
			});
			return Result.success(count);
		} catch (error) {
			return Result.failure(
				DomainError.infrastructure("Failed to count news", "database", {
					cause: error,
				}),
			);
		}
	},
};

// Functional category query repository
export const categoryQueryRepository: ICategoryQueryRepository = {
	findById: async (
		id: CategoryId,
		userId: UserId,
	): Promise<Result<CategoryAggregate | null, DomainError>> => {
		try {
			const prismaCategory = await prisma.categories.findUnique({
				where: { id, userId },
			});

			if (!prismaCategory) {
				return Result.success(null);
			}

			const categoryAggregate = mapPrismaToCategoryAggregate(prismaCategory);
			return Result.success(categoryAggregate);
		} catch (error) {
			return Result.failure(
				DomainError.infrastructure(
					"Failed to find category by ID",
					"database",
					{ cause: error },
				),
			);
		}
	},

	findByName: async (
		name: CategoryName,
		userId: UserId,
	): Promise<Result<CategoryAggregate | null, DomainError>> => {
		try {
			const prismaCategory = await prisma.categories.findUnique({
				where: {
					name_userId: {
						name: CategoryName.unwrap(name),
						userId,
					},
				},
			});

			if (!prismaCategory) {
				return Result.success(null);
			}

			const categoryAggregate = mapPrismaToCategoryAggregate(prismaCategory);
			return Result.success(categoryAggregate);
		} catch (error) {
			return Result.failure(
				DomainError.infrastructure(
					"Failed to find category by name",
					"database",
					{ cause: error },
				),
			);
		}
	},

	findMany: async (
		userId: UserId,
		params?: CategoryFindManyParams,
	): Promise<Result<CategoryAggregate[], DomainError>> => {
		try {
			const prismaCategories = await prisma.categories.findMany({
				where: { userId },
				orderBy: params?.orderBy || { name: "asc" },
				take: params?.take,
				skip: params?.skip,
			});

			const categoryAggregates = prismaCategories.map(
				mapPrismaToCategoryAggregate,
			);
			return Result.success(categoryAggregates);
		} catch (error) {
			return Result.failure(
				DomainError.infrastructure("Failed to find categories", "database", {
					cause: error,
				}),
			);
		}
	},
};
