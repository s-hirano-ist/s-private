import z from "zod";
import {
	idSchema,
	statusSchema,
	userIdSchema,
} from "@/domains/common/entities/common-entity";
import { DomainError, Result } from "@/domains/common/value-objects";
import {
	ContentType,
	ImageDimensions,
	ImagePath,
	ImageTags,
} from "../value-objects";

// Constants
export const THUMBNAIL_WIDTH = 192;
export const THUMBNAIL_HEIGHT = 192;

// Core image schema using branded types
export const imagesInputSchema = z
	.object({
		path: ImagePath.schema,
		contentType: ContentType.schema,
		dimensions: ImageDimensions.schema.optional(),
		tags: ImageTags.schema.default([]),
		description: z.string().nullable().optional(),
		userId: userIdSchema,
		id: idSchema,
		status: statusSchema,
	})
	.strict();

// Legacy schemas for backward compatibility
export const imagesLegacyInputSchema = z
	.object({
		path: z.string(),
		contentType: z.string(),
		fileSize: z.number().nullable().optional(),
		width: z.number().nullable().optional(),
		height: z.number().nullable().optional(),
		tags: z.array(z.string()).optional(),
		description: z.string().nullable().optional(),
		userId: userIdSchema,
		id: idSchema,
		status: statusSchema,
	})
	.strict();

// Domain types
export type ImageId = z.infer<typeof idSchema>;
export type UserId = z.infer<typeof userIdSchema>;
export type ImageStatus = z.infer<typeof statusSchema>;

// Image aggregate
export type ImageAggregate = Readonly<{
	id: ImageId;
	path: ImagePath;
	contentType: ContentType;
	dimensions?: ImageDimensions;
	tags: ImageTags;
	description: string | null;
	userId: UserId;
	status: ImageStatus;
	createdAt?: Date;
	updatedAt?: Date;
	exportedAt?: Date;
}>;

// Image entity functions
export const ImageEntity = {
	create: (
		data: Omit<ImageAggregate, "id">,
	): Result<ImageAggregate, DomainError> => {
		try {
			return Result.success({
				id: idSchema.parse(undefined), // Generate new ID
				...data,
			});
		} catch (error) {
			return Result.failure(
				DomainError.validation("Failed to create image", "image"),
			);
		}
	},

	fromFormData: (
		formData: FormData,
		userId: UserId,
		file: File,
	): Result<Omit<ImageAggregate, "id">, DomainError> => {
		const pathResult = ImagePath.safeParse(formData.get("path") || file.name);
		const contentTypeResult = ContentType.safeParse(file.type);

		if (!pathResult.success) {
			return Result.failure(
				DomainError.validation("Invalid path format", "path"),
			);
		}

		if (!contentTypeResult.success) {
			return Result.failure(
				DomainError.validation("Invalid content type", "contentType"),
			);
		}

		const tagsValue = formData.getAll("tags") as string[];
		const tagsResult = ImageTags.safeParse(tagsValue);
		const tags = tagsResult.success ? tagsResult.data : [];

		const description = (formData.get("description") as string) || null;

		return Result.success({
			path: pathResult.data,
			contentType: contentTypeResult.data,
			dimensions: undefined, // Will be populated after image processing
			tags,
			description,
			userId,
			status: "UNEXPORTED" as ImageStatus,
		});
	},

	updateStatus: (
		image: ImageAggregate,
		newStatus: ImageStatus,
	): ImageAggregate => ({
		...image,
		status: newStatus,
		exportedAt: newStatus === "EXPORTED" ? new Date() : image.exportedAt,
		updatedAt: new Date(),
	}),

	updateDimensions: (
		image: ImageAggregate,
		dimensions: ImageDimensions,
	): ImageAggregate => ({
		...image,
		dimensions,
		updatedAt: new Date(),
	}),

	updateTags: (image: ImageAggregate, tags: ImageTags): ImageAggregate => ({
		...image,
		tags,
		updatedAt: new Date(),
	}),

	updateDescription: (
		image: ImageAggregate,
		description: string | null,
	): ImageAggregate => ({
		...image,
		description,
		updatedAt: new Date(),
	}),

	isExported: (image: ImageAggregate): boolean => image.status === "EXPORTED",

	hasDimensions: (image: ImageAggregate): boolean =>
		image.dimensions !== undefined,

	hasTags: (image: ImageAggregate): boolean =>
		ImageTags.unwrap(image.tags).length > 0,

	hasDescription: (image: ImageAggregate): boolean => {
		return image.description !== null && image.description.trim().length > 0;
	},

	getFileExtension: (image: ImageAggregate): string => {
		const { getFileExtension } =
			require("../value-objects").contentTypeValidationRules;
		return getFileExtension(image.contentType);
	},

	generateThumbnailPath: (image: ImageAggregate): string => {
		const { generateThumbnailPath } =
			require("../value-objects").imagePathValidationRules;
		return generateThumbnailPath(image.path);
	},
};

// Legacy types for backward compatibility
export const imagesFormSchema = imagesLegacyInputSchema;
export type ImagesFormSchema = z.infer<typeof imagesFormSchema>;

export const imagesQueryData = imagesLegacyInputSchema.omit({
	userId: true,
	contentType: true,
	status: true,
});
export type ImagesQueryData = z.infer<typeof imagesQueryData>;
