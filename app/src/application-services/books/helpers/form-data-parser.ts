/**
 * Book form data parsing utilities.
 *
 * @module
 */

import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import {
	getFormDataFile,
	getFormDataString,
} from "@/common/utils/form-data-utils";
import { sharpImageProcessor } from "@/infrastructures/images/services/sharp-image-processor";
import {
	makeBookTitle,
	makeISBN,
	makeRating,
	makeTags,
} from "@s-hirano-ist/s-core/books/entities/book-entity";
import {
	makeContentType,
	makeFileSize,
	makePath,
} from "@s-hirano-ist/s-core/shared-kernel/entities/file-entity";
import { FileNotAllowedError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";

const SUPPORTED_IMAGE_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
]);

function assertSupportedImageType(contentType: string): void {
	if (!SUPPORTED_IMAGE_TYPES.has(contentType)) {
		throw new FileNotAllowedError();
	}
}

async function createThumbnailOrThrowInvalidFile(
	buffer: Buffer,
): Promise<Buffer> {
	try {
		return await sharpImageProcessor.createThumbnail(buffer, 192, 192);
	} catch {
		throw new FileNotAllowedError();
	}
}

/**
 * Parses book creation form data into domain value objects.
 *
 * @param formData - Raw form data from book creation form
 * @param userId - Current user's ID
 * @returns Validated book data with domain value objects
 */
export const parseAddBooksFormData = async (
	formData: FormData,
	userId: UserId,
) => {
	const isbnInput = getFormDataString(formData, "isbn");
	const title = getFormDataString(formData, "title");
	const ratingInput = getFormDataString(formData, "rating");
	const tagsInput = getFormDataString(formData, "tags");
	const file = getFormDataFile(formData, "image");

	const parsedTags = tagsInput
		.split(",")
		.map((t) => t.trim())
		.filter((t) => t.length > 0);

	assertSupportedImageType(file.type);
	const path = makePath(file.name, true);
	const contentType = makeContentType(file.type);
	const fileSize = makeFileSize(file.size);
	const originalBuffer = await sharpImageProcessor.fileToBuffer(file);
	const thumbnailBuffer =
		await createThumbnailOrThrowInvalidFile(originalBuffer);

	return {
		isbn: makeISBN(isbnInput),
		title: makeBookTitle(title),
		rating: makeRating(Number(ratingInput)),
		tags: makeTags(parsedTags),
		userId,
		imagePath: path,
		path,
		contentType,
		fileSize,
		originalBuffer,
		thumbnailBuffer,
	};
};
