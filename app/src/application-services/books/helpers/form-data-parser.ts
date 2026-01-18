/**
 * Book form data parsing utilities.
 *
 * @module
 */

import {
	makeBookImagePath,
	makeBookTitle,
	makeISBN,
} from "@s-hirano-ist/s-core/books/entities/books-entity";
import type { UserId } from "@s-hirano-ist/s-core/common/entities/common-entity";
import {
	makeContentType,
	makeFileSize,
	makePath,
} from "@s-hirano-ist/s-core/common/entities/file-entity";
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
	const ISBN = getFormDataString(formData, "isbn");
	const title = getFormDataString(formData, "title");
	const file = getOptionalFormDataFile(formData, "image");

	const baseData = {
		ISBN: makeISBN(ISBN),
		title: makeBookTitle(title),
		userId,
	};

	if (file === null) {
		return {
			...baseData,
			imagePath: makeBookImagePath(null),
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
		imagePath: makeBookImagePath(path),
		hasImage: true as const,
		path,
		contentType: makeContentType(file.type),
		fileSize: makeFileSize(file.size),
		originalBuffer,
		thumbnailBuffer,
	};
};
