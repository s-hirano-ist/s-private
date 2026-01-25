/**
 * Image Aggregate Root and related Value Objects.
 *
 * @remarks
 * This module defines the Image aggregate root following DDD principles.
 * Image is the sole entry point for all image-related operations within
 * the Images bounded context.
 *
 * **Aggregate Root**: {@link imageEntity}
 *
 * **Invariants**:
 * - Path must be unique per user (enforced by `ImagesDomainService`)
 * - Status transitions: UNEXPORTED → LAST_UPDATED → EXPORTED
 *
 * **Value Objects defined here**:
 * - {@link Pixel} - Image dimension (positive integer)
 * - {@link Tag} - Image tag for organization
 * - {@link Description} - Optional image description (max 1024 chars)
 *
 * **Re-exported from shared-kernel**:
 * - {@link Path}, {@link ContentType}, {@link FileSize} - File-related value objects
 *
 * @see `ImagesDomainService` for domain business rules
 * @see docs/domain-model.md for aggregate boundary documentation
 * @module
 */

import z from "zod";
import {
	CreatedAt,
	ExportedStatus,
	Id,
	makeCreatedAt,
	makeId,
	UnexportedStatus,
	UserId,
} from "../../shared-kernel/entities/common-entity.js";
import {
	ContentType,
	FileSize,
	makeContentType,
	makeFileSize,
	makePath,
	Path,
} from "../../shared-kernel/entities/file-entity.js";
import { createEntityWithErrorHandling } from "../../shared-kernel/services/entity-factory.js";
import { ImageCreatedEvent } from "../events/image-created-event.js";

// Re-export file-related value objects from common for backwards compatibility
export { ContentType, FileSize, makeContentType, makeFileSize, makePath, Path };

/**
 * Zod schema for validating pixel dimensions.
 *
 * @remarks
 * Validates that the value is a positive integer.
 * Optional to handle cases where dimensions cannot be determined.
 *
 * @see {@link makePixel} for factory function
 */
export const Pixel = z.number().int().positive().optional().brand<"Pixel">();

/**
 * Branded type for validated pixel dimensions.
 */
export type Pixel = z.infer<typeof Pixel>;

/**
 * Creates a validated Pixel from a number.
 *
 * @param v - The pixel dimension value
 * @returns A branded Pixel value
 * @throws {ZodError} When the value is not a positive integer
 */
export const makePixel = (v: number): Pixel => Pixel.parse(v);

/**
 * Zod schema for validating image tags.
 *
 * @remarks
 * Tags are non-empty strings used for organizing images.
 *
 * @see {@link makeTag} for factory function
 */
export const Tag = z.string().min(1).brand<"Tag">();

/**
 * Branded type for validated tags.
 */
export type Tag = z.infer<typeof Tag>;

/**
 * Creates a validated Tag from a string.
 *
 * @param v - The tag string
 * @returns A branded Tag value
 * @throws {ZodError} When the tag is empty
 */
export const makeTag = (v: string): Tag => Tag.parse(v);

/**
 * Zod schema for validating image descriptions.
 *
 * @remarks
 * Optional non-empty string for describing the image content.
 *
 * @see {@link makeDescription} for factory function
 */
export const Description = z
	.string()
	.min(1)
	.max(1024, { message: "tooLong" })
	.optional()
	.brand<"Description">();

/**
 * Branded type for validated descriptions.
 */
export type Description = z.infer<typeof Description>;

/**
 * Creates a validated Description from a string.
 *
 * @param v - The description string
 * @returns A branded Description value
 * @throws {ZodError} When the description is empty
 */
export const makeDescription = (v: string): Description => Description.parse(v);

// Entities

/**
 * Base schema containing common image fields.
 *
 * @internal
 */
const Base = z.object({
	id: Id,
	userId: UserId,
	path: Path,
	contentType: ContentType,
	fileSize: FileSize,
	width: Pixel,
	height: Pixel,
	tags: z.array(Tag).optional(),
	description: Description,
	createdAt: CreatedAt,
});

/**
 * Zod schema for an unexported image.
 *
 * @remarks
 * Represents an image that has not yet been published.
 * This is the initial state of all newly created images.
 *
 * @see {@link ExportedImage} for the published state
 */
export const UnexportedImage = Base.extend({ status: UnexportedStatus });

/**
 * Type for an unexported image entity.
 *
 * @remarks
 * Immutable entity representing an image pending export.
 */
export type UnexportedImage = Readonly<z.infer<typeof UnexportedImage>>;

/**
 * Zod schema for an exported image.
 *
 * @remarks
 * Represents an image that has been published.
 * Includes the exportedAt timestamp.
 *
 * @see {@link UnexportedImage} for the initial state
 */
export const ExportedImage = Base.extend(ExportedStatus.shape);

/**
 * Type for an exported image entity.
 *
 * @remarks
 * Immutable entity representing a published image.
 */
export type ExportedImage = Readonly<z.infer<typeof ExportedImage>>;

/**
 * Arguments for creating a new image.
 *
 * @remarks
 * Provides the required fields for image creation.
 * The id, createdAt, and status are auto-generated.
 *
 * @example
 * ```typescript
 * const args: CreateImageArgs = {
 *   userId: makeUserId("user-123"),
 *   path: makePath("image.jpg", true),
 *   contentType: makeContentType("image/jpeg"),
 *   fileSize: makeFileSize(1024 * 1024),
 *   width: makePixel(1920),
 *   height: makePixel(1080),
 *   caller: "addImage",
 * };
 * ```
 */
export type CreateImageArgs = Readonly<{
	/** The user who owns the image */
	userId: UserId;
	/** The storage path for the image */
	path: Path;
	/** The MIME type of the image */
	contentType: ContentType;
	/** The file size in bytes */
	fileSize: FileSize;
	/** Optional width in pixels */
	width?: Pixel;
	/** Optional height in pixels */
	height?: Pixel;
	/** Optional tags for organization */
	tags?: Array<Tag>;
	/** Optional description */
	description?: Description;
	/** The caller identifier for event tracking */
	caller: string;
}>;

/**
 * Return type for image creation: tuple of [entity, event].
 */
export type ImageWithEvent = readonly [UnexportedImage, ImageCreatedEvent];

/**
 * Factory object for Image domain entity operations.
 *
 * **This is the Aggregate Root** for the Images bounded context.
 *
 * @remarks
 * As the aggregate root, Image is the only entry point for creating and
 * managing image entities. All image-related operations must go through
 * this factory to ensure domain invariants are maintained.
 *
 * Provides immutable entity creation following DDD patterns.
 * All returned entities are frozen using Object.freeze().
 * Returns a tuple of [entity, event] for domain event dispatching.
 *
 * @example
 * ```typescript
 * // Create a new unexported image with its domain event
 * const [image, event] = imageEntity.create({
 *   userId: makeUserId("user-123"),
 *   path: makePath("image.jpg", true),
 *   contentType: makeContentType("image/jpeg"),
 *   fileSize: makeFileSize(1024),
 *   caller: "addImage",
 * });
 *
 * // Persist and dispatch event
 * await repository.create(image);
 * await eventDispatcher.dispatch(event);
 * ```
 *
 * @see {@link CreateImageArgs} for creation parameters
 * @see {@link ImageWithEvent} for return type
 * @see `ImagesDomainService` for invariant validation (duplicate path check)
 */
export const imageEntity = {
	/**
	 * Creates a new unexported image entity with its domain event.
	 *
	 * @param args - The creation arguments containing required fields
	 * @returns A tuple of [UnexportedImage, ImageCreatedEvent]
	 * @throws {InvalidFormatError} When validation of any field fails
	 * @throws {UnexpectedError} For unexpected errors during creation
	 */
	create: (args: CreateImageArgs): ImageWithEvent => {
		const { caller, ...entityArgs } = args;
		const image = createEntityWithErrorHandling(() =>
			Object.freeze({
				id: makeId(),
				status: "UNEXPORTED",
				createdAt: makeCreatedAt(),
				...entityArgs,
			}),
		);

		const event = new ImageCreatedEvent({
			id: image.id as string,
			userId: image.userId as string,
			caller,
		});

		return [image, event] as const;
	},
};

// DTO Types

/**
 * DTO for image list display.
 *
 * @remarks
 * Contains only the fields needed for list views, with branded types.
 */
export type ImageListItemDTO = Readonly<{
	id: Id;
	path: Path;
	width: Pixel | undefined;
	height: Pixel | undefined;
}>;
