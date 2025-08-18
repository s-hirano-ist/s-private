import { z } from "zod";
import {
	idSchema,
	statusSchema,
	userIdSchema,
} from "@/domains/common/entities/common-entity";
import { DomainError, Result } from "@/domains/common/value-objects";
import { CategoryName, NewsQuote, NewsTitle, NewsUrl } from "../value-objects";

// Value objects schemas
const openGraphMetadataSchema = z
	.object({
		title: z.string().nullable().optional(),
		description: z.string().nullable().optional(),
		imageUrl: z.string().url().nullable().optional(),
	})
	.strict();

// Core category schema using branded types
export const categoryInputSchema = z
	.object({
		name: CategoryName.schema,
		userId: userIdSchema,
		id: idSchema,
	})
	.strict();

// Core news schema using branded types
export const newsInputSchema = z
	.object({
		category: categoryInputSchema,
		title: NewsTitle.schema,
		quote: NewsQuote.schema,
		url: NewsUrl.schema,
		userId: userIdSchema,
		id: idSchema,
		status: statusSchema,
		openGraphMetadata: openGraphMetadataSchema.optional(),
	})
	.strict();

// Domain types
export type NewsId = z.infer<typeof idSchema>;
export type CategoryId = z.infer<typeof idSchema>;
export type UserId = z.infer<typeof userIdSchema>;
export type NewsStatus = z.infer<typeof statusSchema>;

export type OpenGraphMetadata = z.infer<typeof openGraphMetadataSchema>;

// Category aggregate
export type CategoryAggregate = Readonly<{
	id: CategoryId;
	name: CategoryName;
	userId: UserId;
	createdAt?: Date;
	updatedAt?: Date;
}>;

// News aggregate
export type NewsAggregate = Readonly<{
	id: NewsId;
	category: CategoryAggregate;
	title: NewsTitle;
	quote: NewsQuote;
	url: NewsUrl;
	userId: UserId;
	status: NewsStatus;
	openGraphMetadata?: OpenGraphMetadata;
	createdAt?: Date;
	updatedAt?: Date;
	exportedAt?: Date;
}>;

// Category entity functions
export const CategoryEntity = {
	create: (
		data: Omit<CategoryAggregate, "id">,
	): Result<CategoryAggregate, DomainError> => {
		const parseResult = Result.fromZodParse(
			categoryInputSchema.omit({ id: true }),
			data,
			(error) => DomainError.fromZodError(error, "category"),
		);

		if (parseResult.isFailure) {
			return parseResult;
		}

		return Result.success({
			id: idSchema.parse(undefined), // Generate new ID
			...parseResult.value,
		});
	},

	fromFormData: (
		name: string,
		userId: UserId,
	): Result<Omit<CategoryAggregate, "id">, DomainError> => {
		const nameResult = CategoryName.safeParse(name);

		if (!nameResult.success) {
			return Result.failure(
				DomainError.validation("Invalid category name", "name"),
			);
		}

		return Result.success({
			name: nameResult.data,
			userId,
		});
	},

	updateName: (
		category: CategoryAggregate,
		newName: CategoryName,
	): CategoryAggregate => ({
		...category,
		name: newName,
		updatedAt: new Date(),
	}),
};

// News entity functions
export const NewsEntity = {
	create: (
		data: Omit<NewsAggregate, "id">,
	): Result<NewsAggregate, DomainError> => {
		const parseResult = Result.fromZodParse(
			newsInputSchema.omit({ id: true }),
			data,
			(error) => DomainError.fromZodError(error, "news"),
		);

		if (parseResult.isFailure) {
			return parseResult;
		}

		return Result.success({
			id: idSchema.parse(undefined), // Generate new ID
			...parseResult.value,
		});
	},

	fromFormData: (
		formData: FormData,
		userId: UserId,
		category: CategoryAggregate,
	): Result<Omit<NewsAggregate, "id">, DomainError> => {
		const titleResult = NewsTitle.safeParse(formData.get("title"));
		const urlResult = NewsUrl.safeParse(formData.get("url"));
		const quoteValue = formData.get("quote");
		const quoteResult = NewsQuote.safeParse(
			quoteValue === "" ? null : quoteValue,
		);

		if (!titleResult.success) {
			return Result.failure(
				DomainError.validation("Invalid title format", "title"),
			);
		}

		if (!urlResult.success) {
			return Result.failure(
				DomainError.validation("Invalid URL format", "url"),
			);
		}

		if (!quoteResult.success) {
			return Result.failure(
				DomainError.validation("Invalid quote format", "quote"),
			);
		}

		return Result.success({
			category,
			title: titleResult.data,
			quote: quoteResult.data,
			url: urlResult.data,
			userId,
			status: "UNEXPORTED" as NewsStatus,
			openGraphMetadata: undefined,
		});
	},

	updateStatus: (
		news: NewsAggregate,
		newStatus: NewsStatus,
	): NewsAggregate => ({
		...news,
		status: newStatus,
		exportedAt: newStatus === "EXPORTED" ? new Date() : news.exportedAt,
		updatedAt: new Date(),
	}),

	updateQuote: (news: NewsAggregate, quote: NewsQuote): NewsAggregate => ({
		...news,
		quote,
		updatedAt: new Date(),
	}),

	updateOpenGraphMetadata: (
		news: NewsAggregate,
		metadata: OpenGraphMetadata,
	): NewsAggregate => ({
		...news,
		openGraphMetadata: metadata,
		updatedAt: new Date(),
	}),

	assignToCategory: (
		news: NewsAggregate,
		category: CategoryAggregate,
	): NewsAggregate => ({
		...news,
		category,
		updatedAt: new Date(),
	}),

	isExported: (news: NewsAggregate): boolean => news.status === "EXPORTED",

	hasQuote: (news: NewsAggregate): boolean => {
		const quote = NewsQuote.unwrap(news.quote);
		return quote !== null && quote !== undefined && quote.trim().length > 0;
	},

	hasOpenGraphMetadata: (news: NewsAggregate): boolean =>
		news.openGraphMetadata !== undefined,

	isSameDomain: (news1: NewsAggregate, news2: NewsAggregate): boolean => {
		const domain1 = new URL(NewsUrl.unwrap(news1.url)).hostname;
		const domain2 = new URL(NewsUrl.unwrap(news2.url)).hostname;
		return domain1 === domain2;
	},
};

// Remove legacy exports - these are no longer needed
