import { getFormDataFile } from "@/common/utils/form-data-utils";
import { makeUserId } from "@/domains/common/entities/common-entity";
import {
	makeContentType,
	makeFileSize,
	makeOriginalBuffer,
	makePath,
	makeThumbnailBuffer,
} from "@/domains/images/entities/images-entity";

export const parseAddImagesFormData = async (
	formData: FormData,
	userId: string,
) => {
	const file = getFormDataFile(formData, "file");

	return {
		userId: makeUserId(userId),
		path: makePath(file.name),
		contentType: makeContentType(file.type),
		fileSize: makeFileSize(file.size),
		originalBuffer: await makeOriginalBuffer(file),
		thumbnailBuffer: await makeThumbnailBuffer(file),
	};
};
