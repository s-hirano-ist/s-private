import { getFormDataFile } from "@/common/utils/form-data-utils";
import type { UserId } from "@/domains/common/entities/common-entity";
import {
	makeContentType,
	makeFileSize,
	makeOriginalBuffer,
	makePath,
	makeThumbnailBufferFromFile,
} from "@/domains/images/entities/image-entity";

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
