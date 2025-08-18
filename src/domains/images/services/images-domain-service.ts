import "server-only";
import sharp from "sharp";
import { v7 as uuidv7 } from "uuid";
import { DomainError, Result } from "@/domains/common/value-objects";
import {
	type ImageAggregate,
	ImageEntity,
	type ImagesFormSchema,
	imagesFormSchema,
	THUMBNAIL_HEIGHT,
	THUMBNAIL_WIDTH,
	type UserId,
} from "../entities/images-entity";
import type { IImagesQueryRepository } from "../types";
import { ImagePath } from "../value-objects";

export function sanitizeFileName(fileName: string) {
	return fileName.replaceAll(/[^a-zA-Z0-9._-]/g, "");
}

// Reader monad pattern for dependency injection
export type ImagesDomainServiceDeps = {
	readonly imagesQueryRepository: IImagesQueryRepository;
};

export type ImagesDomainServiceReader<T> = (
	deps: ImagesDomainServiceDeps,
) => Promise<Result<T, DomainError>>;

// Pure domain functions
export const imagesDomainOperations = {
	validateNewImage: async (
		formData: FormData,
		userId: UserId,
		file: File,
		deps: ImagesDomainServiceDeps,
	): Promise<Result<ImageAggregate, DomainError>> => {
		// Validate file type and size
		const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
		const maxFileSize = 100 * 1024 * 1024; // 100MB

		if (!allowedMimeTypes.includes(file.type)) {
			return Result.failure(
				DomainError.validation("File type not allowed", "file"),
			);
		}

		if (file.size > maxFileSize) {
			return Result.failure(DomainError.validation("File too large", "file"));
		}

		// Parse form data into domain object
		const imageDataResult = ImageEntity.fromFormData(formData, userId, file);
		if (imageDataResult.isFailure) {
			return imageDataResult;
		}

		// Check for duplicates
		const path = imageDataResult.value.path;
		const duplicateCheckResult = await checkPathDuplicate(path, userId, deps);
		if (duplicateCheckResult.isFailure) {
			return duplicateCheckResult;
		}

		// Create image entity
		return ImageEntity.create(imageDataResult.value);
	},

	processImageBuffers: async (
		file: File,
	): Promise<
		Result<{ originalBuffer: Buffer; thumbnailBuffer: Buffer }, DomainError>
	> => {
		try {
			const originalBuffer = Buffer.from(await file.arrayBuffer());
			const thumbnailBuffer = await sharp(originalBuffer)
				.resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT)
				.toBuffer();

			return Result.success({ originalBuffer, thumbnailBuffer });
		} catch (error) {
			return Result.failure(
				DomainError.validation("Failed to process image", "file"),
			);
		}
	},
};

// Helper functions
const checkPathDuplicate = async (
	path: ImagePath,
	userId: UserId,
	deps: ImagesDomainServiceDeps,
): Promise<Result<void, DomainError>> => {
	const existingImage = await deps.imagesQueryRepository.findByPath(
		ImagePath.unwrap(path),
		userId,
	);

	if (existingImage !== null) {
		return Result.failure(
			DomainError.duplicate(
				"An image with this path already exists",
				"image",
				ImagePath.unwrap(path),
			),
		);
	}

	return Result.success(undefined);
};

// Legacy class-based service for backward compatibility
export class ImagesDomainService {
	constructor(private readonly imagesQueryRepository: IImagesQueryRepository) {}

	public async prepareNewImages(formData: FormData, userId: string) {
		const file = formData.get("file") as File;
		if (!file) throw new Error("UnexpectedError");

		const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
		const maxFileSize = 100 * 1024 * 1024; // 100MB
		if (!allowedMimeTypes.includes(file.type) || file.size > maxFileSize)
			throw new Error("FileNotAllowedError");

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
		if (!imagesValidatedFields.success) throw new Error("InvalidFormatError");

		// check duplicate
		const exists = await this.imagesQueryRepository.findByPath(
			imagesValidatedFields.data.path,
			userId,
		);
		if (exists !== null) throw new Error("DuplicateError");

		return {
			validatedImages: imagesValidatedFields.data,
			thumbnailBuffer,
			originalBuffer,
		};
	}
}
