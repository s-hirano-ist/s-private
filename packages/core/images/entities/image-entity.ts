import z from "zod";
import {
	CreatedAt,
	ExportedStatus,
	Id,
	makeCreatedAt,
	makeId,
	UnexportedStatus,
	UserId,
} from "../../common/entities/common-entity.js";
import { createEntityWithErrorHandling } from "../../common/services/entity-factory.js";
import { idGenerator } from "../../common/services/id-generator.js";

// Value objects

/**
 * Zod schema for validating image paths.
 *
 * @remarks
 * Validates that the path is a non-empty string.
 * Paths are stored in MinIO object storage.
 *
 * @example
 * ```typescript
 * const path = Path.parse("01912c9a-image.jpg");
 * ```
 *
 * @see {@link makePath} for factory function
 */
export const Path = z.string().min(1).brand<"Path">();

/**
 * Branded type for validated image paths.
 */
export type Path = z.infer<typeof Path>;

/**
 * Creates a validated Path from a string.
 *
 * @param v - The raw path or filename string
 * @param sanitizeAndUnique - If true, sanitizes the filename and prepends a UUIDv7
 * @returns A branded Path value
 * @throws {ZodError} When the path is empty
 *
 * @example
 * ```typescript
 * // Create unique path from user-uploaded filename
 * const path = makePath("my image.jpg", true);
 * // Result: "01912c9a-5e8a-7b5c-8a1b-2c3d4e5f6a7b-myimage.jpg"
 *
 * // Use existing path as-is
 * const existingPath = makePath("existing-path.jpg", false);
 * ```
 */
export const makePath = (v: string, sanitizeAndUnique: boolean): Path => {
	if (sanitizeAndUnique) {
		const sanitizedFileName = v.replaceAll(/[^a-zA-Z0-9._-]/g, "");
		const path = `${idGenerator.uuidv7()}-${sanitizedFileName}`;
		return Path.parse(path);
	}
	return Path.parse(v);
};

/**
 * Zod schema for validating image content types.
 *
 * @remarks
 * Only allows JPEG, PNG, and GIF formats.
 *
 * @example
 * ```typescript
 * const type = ContentType.parse("image/jpeg");
 * ```
 *
 * @see {@link makeContentType} for factory function
 */
export const ContentType = z
	.enum(["image/jpeg", "image/png", "image/gif", "jpeg", "png"])
	.brand<"ContentType">();

/**
 * Branded type for validated content types.
 */
export type ContentType = z.infer<typeof ContentType>;

/**
 * Creates a validated ContentType from a string.
 *
 * @param v - The MIME type or format string
 * @returns A branded ContentType value
 * @throws {ZodError} When the content type is not supported
 *
 * @example
 * ```typescript
 * const type = makeContentType("image/jpeg");
 * ```
 */
export const makeContentType = (v: string): ContentType => ContentType.parse(v);

/**
 * Zod schema for validating file sizes.
 *
 * @remarks
 * Validates that the size is a non-negative integer up to 100MB.
 *
 * @example
 * ```typescript
 * const size = FileSize.parse(1024 * 1024); // 1MB
 * ```
 *
 * @see {@link makeFileSize} for factory function
 */
export const FileSize = z
	.number()
	.int()
	.nonnegative()
	.max(100 * 1024 * 1024) // 100MB
	.brand<"FileSize">();

/**
 * Branded type for validated file sizes.
 */
export type FileSize = z.infer<typeof FileSize>;

/**
 * Creates a validated FileSize from a number.
 *
 * @param v - The file size in bytes
 * @returns A branded FileSize value
 * @throws {ZodError} When the size exceeds 100MB or is negative
 *
 * @example
 * ```typescript
 * const size = makeFileSize(1024 * 1024); // 1MB
 * ```
 */
export const makeFileSize = (v: number): FileSize => FileSize.parse(v);

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
export const Description = z.string().min(1).optional().brand<"Description">();

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
}>;

/**
 * Factory object for Image domain entity operations.
 *
 * @remarks
 * Provides immutable entity creation following DDD patterns.
 * All returned entities are frozen using Object.freeze().
 *
 * @example
 * ```typescript
 * // Create a new unexported image
 * const image = imageEntity.create({
 *   userId: makeUserId("user-123"),
 *   path: makePath("image.jpg", true),
 *   contentType: makeContentType("image/jpeg"),
 *   fileSize: makeFileSize(1024),
 * });
 *
 * ```
 *
 * @see {@link CreateImageArgs} for creation parameters
 */
export const imageEntity = {
	/**
	 * Creates a new unexported image entity.
	 *
	 * @param args - The creation arguments containing required fields
	 * @returns A frozen UnexportedImage instance with generated id and timestamps
	 * @throws {InvalidFormatError} When validation of any field fails
	 * @throws {UnexpectedError} For unexpected errors during creation
	 */
	create: (args: CreateImageArgs): UnexportedImage => {
		return createEntityWithErrorHandling(() =>
			Object.freeze({
				id: makeId(),
				status: "UNEXPORTED",
				createdAt: makeCreatedAt(),
				...args,
			}),
		);
	},
};
