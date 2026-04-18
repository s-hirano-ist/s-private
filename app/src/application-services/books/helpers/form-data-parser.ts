/**
 * Book form data parsing utilities.
 *
 * @module
 */

import {
	makeBookTitle,
	makeISBN,
	makeRating,
	makeTags,
} from "@s-hirano-ist/s-core/books/entities/book-entity";
import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import {
	makeContentType,
	makeFileSize,
	makePath,
} from "@s-hirano-ist/s-core/shared-kernel/entities/file-entity";
import { getFormDataString } from "@/common/utils/form-data-utils";
import { sharpImageProcessor } from "@/infrastructures/images/services/sharp-image-processor";

/**
 * Gets optional file from FormData, returns null if not provided or empty.
 */
const getOptionalFormDataFile = (
	formData: FormData,
	key: string,
): File | null => {
	const value = formData.get(key);
	if (!(value instanceof File) || value.size === 0) {
		return null;
	}
	return value;
};

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
	const file = getOptionalFormDataFile(formData, "image");

	const parsedTags = tagsInput
		.split(",")
		.map((t) => t.trim())
		.filter((t) => t.length > 0);

	const baseData = {
		isbn: makeISBN(isbnInput),
		title: makeBookTitle(title),
		rating: makeRating(Number(ratingInput)),
		tags: makeTags(parsedTags),
		userId,
	};

	if (file === null) {
		return {
			...baseData,
			imagePath: undefined,
			hasImage: false as const,
		};
	}

	const path = makePath(file.name, true);
	const originalBuffer = await sharpImageProcessor.fileToBuffer(file);
	const thumbnailBuffer = await sharpImageProcessor.createThumbnail(
		originalBuffer,
		192,
		192,
	);

	return {
		...baseData,
		imagePath: path,
		hasImage: true as const,
		path,
		contentType: makeContentType(file.type),
		fileSize: makeFileSize(file.size),
		originalBuffer,
		thumbnailBuffer,
	};
};
