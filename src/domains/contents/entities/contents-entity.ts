import { z } from "zod";
import {
	idSchema,
	statusSchema,
	userIdSchema,
} from "@/domains/common/entities/common-entity";
import { DomainError, Result } from "@/domains/common/value-objects";
import { ContentTitle, MarkdownContent } from "../value-objects";

// Core content schema using branded types
export const contentsInputSchema = z
	.object({
		title: ContentTitle.schema,
		markdown: MarkdownContent.schema,
		userId: userIdSchema,
		id: idSchema,
		status: statusSchema,
	})
	.strict();

// Legacy schemas for backward compatibility
export const contentsLegacyInputSchema = z
	.object({
		title: z
			.string({ message: "required" })
			.min(1, { message: "required" })
			.max(64, { message: "tooLong" }),
		markdown: z.string({ message: "required" }).min(1, { message: "required" }),
		userId: userIdSchema,
		id: idSchema,
		status: statusSchema,
	})
	.strict();

// Domain types
export type ContentId = z.infer<typeof idSchema>;
export type UserId = z.infer<typeof userIdSchema>;
export type ContentStatus = z.infer<typeof statusSchema>;

// Content aggregate
export type ContentAggregate = Readonly<{
	id: ContentId;
	title: ContentTitle;
	markdown: MarkdownContent;
	userId: UserId;
	status: ContentStatus;
	createdAt?: Date;
	updatedAt?: Date;
	exportedAt?: Date;
}>;

// Content entity functions
export const ContentEntity = {
	create: (
		data: Omit<ContentAggregate, "id">,
	): Result<ContentAggregate, DomainError> => {
		try {
			return Result.success({
				id: idSchema.parse(undefined), // Generate new ID
				...data,
			});
		} catch (error) {
			return Result.failure(
				DomainError.validation("Failed to create content", "content"),
			);
		}
	},

	fromFormData: (
		formData: FormData,
		userId: UserId,
	): Result<Omit<ContentAggregate, "id">, DomainError> => {
		const titleResult = ContentTitle.safeParse(formData.get("title"));
		const markdownResult = MarkdownContent.safeParse(formData.get("markdown"));

		if (!titleResult.success) {
			return Result.failure(
				DomainError.validation("Invalid title format", "title"),
			);
		}

		if (!markdownResult.success) {
			return Result.failure(
				DomainError.validation("Invalid markdown format", "markdown"),
			);
		}

		return Result.success({
			title: titleResult.data,
			markdown: markdownResult.data,
			userId,
			status: "UNEXPORTED" as ContentStatus,
		});
	},

	updateStatus: (
		content: ContentAggregate,
		newStatus: ContentStatus,
	): ContentAggregate => ({
		...content,
		status: newStatus,
		exportedAt: newStatus === "EXPORTED" ? new Date() : content.exportedAt,
		updatedAt: new Date(),
	}),

	updateTitle: (
		content: ContentAggregate,
		title: ContentTitle,
	): ContentAggregate => ({
		...content,
		title,
		updatedAt: new Date(),
	}),

	updateMarkdown: (
		content: ContentAggregate,
		markdown: MarkdownContent,
	): ContentAggregate => ({
		...content,
		markdown,
		updatedAt: new Date(),
	}),

	isExported: (content: ContentAggregate): boolean =>
		content.status === "EXPORTED",

	getWordCount: (content: ContentAggregate): number => {
		const { getWordCount } =
			require("../value-objects").markdownContentValidationRules;
		return getWordCount(content.markdown);
	},

	hasCodeBlocks: (content: ContentAggregate): boolean => {
		const { hasCodeBlocks } =
			require("../value-objects").markdownContentValidationRules;
		return hasCodeBlocks(content.markdown);
	},

	extractHeadings: (content: ContentAggregate): string[] => {
		const { extractHeadings } =
			require("../value-objects").markdownContentValidationRules;
		return extractHeadings(content.markdown);
	},
};

// Legacy types for backward compatibility
export const contentsFormSchema = contentsLegacyInputSchema;
export type ContentsFormSchema = z.infer<typeof contentsFormSchema>;

export const contentsQueryData = contentsFormSchema.omit({
	userId: true,
	status: true,
	markdown: true,
});
export type ContentsQueryData = z.infer<typeof contentsQueryData>;

export const singleContentsQueryData = contentsFormSchema.omit({
	userId: true,
	status: true,
});
export type SingleContentsQueryData = z.infer<typeof singleContentsQueryData>;
