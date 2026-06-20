/**
 * Image form data parsing utilities.
 *
 * @remarks
 * Converts uploaded file data into validated domain value objects
 * with thumbnail generation.
 *
 * @module
 */

import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { parseSupportedImageFile } from "@/application-services/common/image-upload-parser";
import { getFormDataFile } from "@/common/utils/form-data-utils";
import {
	makeContentType,
	makeFileSize,
	makePath,
} from "@s-hirano-ist/s-core/images/entities/image-entity";

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
	const {
		contentType: detectedContentType,
		originalBuffer,
		thumbnailBuffer,
	} = await parseSupportedImageFile(file);
	const path = makePath(file.name, true);
	const contentType = makeContentType(detectedContentType);
	const fileSize = makeFileSize(file.size);

	return {
		userId,
		path,
		contentType,
		fileSize,
		originalBuffer,
		thumbnailBuffer,
	};
};
