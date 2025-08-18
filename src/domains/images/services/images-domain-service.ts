import "server-only";
import sharp from "sharp";
import { v7 as uuidv7 } from "uuid";
import { ZodError } from "zod";
import {
	DuplicateError,
	FileNotAllowedError,
	InvalidFormatError,
	UnexpectedError,
} from "@/common/error/error-classes";
import {
	makeUserId,
	type UserId,
} from "@/domains/common/entities/common-entity";
import {
	imageDomainService,
	makeContentType,
	makePath,
	type Path,
	THUMBNAIL_HEIGHT,
	THUMBNAIL_WIDTH,
} from "../entities/images-entity";
import type { IImagesQueryRepository } from "../types";

export function sanitizeFileName(fileName: string) {
	return fileName.replaceAll(/[^a-zA-Z0-9._-]/g, "");
}

export class ImagesDomainService {
	constructor(private readonly imagesQueryRepository: IImagesQueryRepository) {}

	public async ensureNoDuplicate(path: Path, userId: UserId): Promise<void> {
		const exists = await this.imagesQueryRepository.findByPath(path, userId);
		if (exists) {
			throw new DuplicateError();
		}
	}

	public async prepareNewImages(formData: FormData, userId: string) {
		const file = (() => {
			const file = formData.get("file");
			if (file instanceof File) return file;
			throw new UnexpectedError();
		})();

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

		try {
			const image = imageDomainService.create({
				userId: makeUserId(userId),
				path: makePath(path),
				contentType: makeContentType(file.type),
			});

			// check duplicate
			const exists = await this.imagesQueryRepository.findByPath(
				image.path,
				userId,
			);
			if (exists !== null) throw new DuplicateError();

			return { image, thumbnailBuffer, originalBuffer };
		} catch (error) {
			if (error instanceof ZodError) throw new InvalidFormatError();
			throw new UnexpectedError();
		}
	}
}
