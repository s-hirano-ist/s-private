/**
 * Image form data parsing utilities.
 *
 * @remarks
 * Converts uploaded file data into validated domain value objects
 * with thumbnail generation.
 *
 * @module
 */

import type { UserId } from "@s-hirano-ist/s-core/common/entities/common-entity";
import {
	makeContentType,
	makeFileSize,
	makeOriginalBuffer,
	makePath,
	makeThumbnailBufferFromFile,
} from "@s-hirano-ist/s-core/images/entities/image-entity";
import { getFormDataFile } from "@/common/utils/form-data-utils";

/**
 * Parses image upload form data into domain value objects.
 *
 * @remarks
 * Generates both original and thumbnail buffers from the uploaded file.
 *
 * @param formData - Raw form data containing the image file
 * @param userId - Current user's ID
 * @returns Validated image data with buffers for storage
 */
export const parseAddImageFormData = async (
	formData: FormData,
	userId: UserId,
) => {
	const file = getFormDataFile(formData, "file");

	return {
		userId,
		path: makePath(file.name, true),
		contentType: makeContentType(file.type),
		fileSize: makeFileSize(file.size),
		originalBuffer: await makeOriginalBuffer(file),
		thumbnailBuffer: await makeThumbnailBufferFromFile(file),
	};
};
