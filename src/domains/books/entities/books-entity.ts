import { z } from "zod";
import {
	idSchema,
	statusSchema,
	userIdSchema,
} from "@/domains/common/entities/common-entity";
import { DomainError, Result } from "@/domains/common/value-objects";
import { BookTags, BookTitle, ISBN, Rating } from "../value-objects";

// Value objects schemas
const googleMetadataSchema = z
	.object({
		title: z.string().nullable().optional(),
		subTitle: z.string().nullable().optional(),
		authors: z.array(z.string()).nullable().optional(),
		description: z.string().nullable().optional(),
		imgSrc: z.string().url().nullable().optional(),
		href: z.string().url().nullable().optional(),
	})
	.strict();

const markdownContentSchema = z.string().nullable().optional();

// Core book input schema using branded types
export const booksInputSchema = z
	.object({
		ISBN: ISBN.schema,
		title: BookTitle.schema,
		userId: userIdSchema,
		id: idSchema,
		status: statusSchema,
		rating: Rating.schema.nullable().optional(),
		tags: BookTags.schema.default([]),
		markdown: markdownContentSchema,
		googleMetadata: googleMetadataSchema.optional(),
	})
	.strict();

// Removed legacy schemas - using only the functional approach

// Domain types
export type BookId = z.infer<typeof idSchema>;
export type UserId = z.infer<typeof userIdSchema>;
export type BookStatus = z.infer<typeof statusSchema>;

export type GoogleMetadata = z.infer<typeof googleMetadataSchema>;
export type MarkdownContent = z.infer<typeof markdownContentSchema>;

// Book aggregate
export type BookAggregate = Readonly<{
	id: BookId;
	isbn: ISBN;
	title: BookTitle;
	userId: UserId;
	status: BookStatus;
	rating: Rating | null;
	tags: BookTags;
	markdown: MarkdownContent;
	googleMetadata?: GoogleMetadata;
	createdAt?: Date;
	updatedAt?: Date;
	exportedAt?: Date;
}>;

// Entity creation functions
export const BookEntity = {
	create: (
		data: Omit<BookAggregate, "id">,
	): Result<BookAggregate, DomainError> => {
		return Result.fromZodParse(
			booksInputSchema.omit({ id: true }),
			data,
			(error) => DomainError.fromZodError(error, "book"),
		).map((validatedData) => ({
			id: idSchema.parse(undefined), // Generate new ID
			...validatedData,
		}));
	},

	fromFormData: (
		formData: FormData,
		userId: UserId,
	): Result<Omit<BookAggregate, "id">, DomainError> => {
		const isbnResult = ISBN.safeParse(formData.get("isbn"));
		const titleResult = BookTitle.safeParse(formData.get("title"));

		if (!isbnResult.success) {
			return Result.failure(
				DomainError.validation("Invalid ISBN format", "isbn"),
			);
		}

		if (!titleResult.success) {
			return Result.failure(
				DomainError.validation("Invalid title format", "title"),
			);
		}

		const ratingValue = formData.get("rating");
		const rating = ratingValue
			? Rating.safeParse(Number(ratingValue)).data
			: null;

		const tagsValue = formData.getAll("tags") as string[];
		const tags = BookTags.safeParse(tagsValue).data || [];

		return Result.success({
			isbn: isbnResult.data,
			title: titleResult.data,
			userId,
			status: "UNEXPORTED" as BookStatus,
			rating,
			tags,
			markdown: (formData.get("markdown") as string) || null,
			googleMetadata: undefined,
		});
	},

	updateStatus: (
		book: BookAggregate,
		newStatus: BookStatus,
	): BookAggregate => ({
		...book,
		status: newStatus,
		exportedAt: newStatus === "EXPORTED" ? new Date() : book.exportedAt,
		updatedAt: new Date(),
	}),

	updateRating: (
		book: BookAggregate,
		rating: Rating | null,
	): BookAggregate => ({
		...book,
		rating,
		updatedAt: new Date(),
	}),

	updateTags: (book: BookAggregate, tags: BookTags): BookAggregate => ({
		...book,
		tags,
		updatedAt: new Date(),
	}),

	updateMarkdown: (
		book: BookAggregate,
		markdown: MarkdownContent,
	): BookAggregate => ({
		...book,
		markdown,
		updatedAt: new Date(),
	}),

	updateGoogleMetadata: (
		book: BookAggregate,
		metadata: GoogleMetadata,
	): BookAggregate => ({
		...book,
		googleMetadata: metadata,
		updatedAt: new Date(),
	}),

	isExported: (book: BookAggregate): boolean => book.status === "EXPORTED",

	hasRating: (book: BookAggregate): boolean => book.rating !== null,

	hasTags: (book: BookAggregate): boolean =>
		BookTags.unwrap(book.tags).length > 0,

	hasGoogleMetadata: (book: BookAggregate): boolean =>
		book.googleMetadata !== undefined,
};

// Remove legacy exports - these are no longer needed
