import type { UserId } from "s-private-domains/common/entities/common-entity";
import {
	makeContentType,
	makeFileSize,
	makeOriginalBuffer,
	makePath,
	makeThumbnailBufferFromFile,
} from "s-private-domains/images/entities/image-entity";
import { getFormDataFile } from "@/common/utils/form-data-utils";

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
