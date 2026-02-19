import z from "zod";
import { idGenerator } from "../services/id-generator.js";

// Value objects

/**
 * Zod schema for validating file paths.
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
export const Path = z
	.string()
	.min(1)
	.max(512, { message: "tooLong" })
	.brand<"Path">();

/**
 * Branded type for validated file paths.
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
 * Zod schema for validating file content types.
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
