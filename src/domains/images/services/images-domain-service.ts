import "server-only";
import sharp from "sharp";
import { v7 as uuidv7 } from "uuid";
import {
	DuplicateError,
	FileNotAllowedError,
	InvalidFormatError,
	UnexpectedError,
} from "@/common/error/error-classes";
import {
	type ImagesFormSchema,
	imagesFormSchema,
	THUMBNAIL_HEIGHT,
	THUMBNAIL_WIDTH,
} from "../entities/images-entity";
import { IImagesQueryRepository } from "../types";

export function sanitizeFileName(fileName: string) {
	return fileName.replaceAll(/[^a-zA-Z0-9._-]/g, "");
}

export class ImagesDomainService {
	constructor(private readonly imagesQueryRepository: IImagesQueryRepository) {}

	public async prepareNewImages(formData: FormData, userId: string) {
		const file = formData.get("file") as File;
		if (!file) throw new UnexpectedError();

		const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
		const maxFileSize = 100 * 1024 * 1024; // 100MB
		if (!allowedMimeTypes.includes(file.type) || file.size > maxFileSize)
			throw new FileNotAllowedError();

		const sanitizedFileName = sanitizeFileName(file.name);

		const path = `${uuidv7()}-${sanitizedFileName}`;

		const originalBuffer = Buffer.from(await file.arrayBuffer());

		const thumbnailBuffer = await sharp(originalBuffer)
			.resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT)
			.toBuffer();

		const formValues = {
			userId,
			status: "UNEXPORTED",
			path,
			contentType: file.type,
		} satisfies Omit<ImagesFormSchema, "id">;

		const imagesValidatedFields = imagesFormSchema.safeParse(formValues);
		if (!imagesValidatedFields.success) throw new InvalidFormatError();

		// check duplicate
		const exists = await this.imagesQueryRepository.findByPath(
			imagesValidatedFields.data.path,
			userId,
		);
		if (exists !== null) throw new DuplicateError();

		return {
			validatedImages: imagesValidatedFields.data,
			thumbnailBuffer,
			originalBuffer,
		};
	}
}
