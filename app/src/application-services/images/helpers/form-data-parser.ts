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
import { sharpImageProcessor } from "@/infrastructures/images/services/sharp-image-processor";
import {
	makeContentType,
	makeFileSize,
	makePath,
} from "@s-hirano-ist/s-core/images/entities/image-entity";
import { FileNotAllowedError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";

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
	const { contentType: detectedContentType, originalBuffer } =
		await parseSupportedImageFile(file);
	const path = makePath(file.name, true);
	const contentType = makeContentType(detectedContentType);
	const fileSize = makeFileSize(file.size);
	const thumbnailBuffer =
		await createThumbnailOrThrowInvalidFile(originalBuffer);

	return {
		userId,
		path,
		contentType,
		fileSize,
		originalBuffer,
		thumbnailBuffer,
	};
};
