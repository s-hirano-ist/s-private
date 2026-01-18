/**
 * Image form data parsing utilities.
 *
 * @remarks
 * Converts uploaded file data into validated domain value objects
 * with thumbnail generation.
 *
 * @module
 */

import {
	makeContentType,
	makeFileSize,
	makePath,
} from "@s-hirano-ist/s-core/images/entities/image-entity";
import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { getFormDataFile } from "@/common/utils/form-data-utils";
import { sharpImageProcessor } from "@/infrastructures/images/services/sharp-image-processor";

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
	const originalBuffer = await sharpImageProcessor.fileToBuffer(file);
	const thumbnailBuffer = await sharpImageProcessor.createThumbnail(
		originalBuffer,
		192,
		192,
	);

	return {
		userId,
		path: makePath(file.name, true),
		contentType: makeContentType(file.type),
		fileSize: makeFileSize(file.size),
		originalBuffer,
		thumbnailBuffer,
	};
};
