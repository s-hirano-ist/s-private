import { z } from "zod";
import { createBrandedType } from "@/domains/common/value-objects";

const imagePathSchema = z
	.string()
	.min(1, "Image path is required")
	.max(500, "Image path is too long")
	.regex(/^[a-zA-Z0-9\/_\-\.]+$/, "Image path contains invalid characters");

export const ImagePath = createBrandedType("ImagePath", imagePathSchema);
export type ImagePath = ReturnType<typeof ImagePath.create>;

export const imagePathValidationRules = {
	isValidFormat: (value: string): boolean => {
		return /^[a-zA-Z0-9\/_\-\.]+$/.test(value);
	},

	extractExtension: (path: ImagePath): string => {
		const pathString = ImagePath.unwrap(path);
		const lastDotIndex = pathString.lastIndexOf(".");
		return lastDotIndex !== -1
			? pathString.substring(lastDotIndex + 1).toLowerCase()
			: "";
	},

	extractFileName: (path: ImagePath): string => {
		const pathString = ImagePath.unwrap(path);
		const lastSlashIndex = pathString.lastIndexOf("/");
		return lastSlashIndex !== -1
			? pathString.substring(lastSlashIndex + 1)
			: pathString;
	},

	extractDirectory: (path: ImagePath): string => {
		const pathString = ImagePath.unwrap(path);
		const lastSlashIndex = pathString.lastIndexOf("/");
		return lastSlashIndex !== -1 ? pathString.substring(0, lastSlashIndex) : "";
	},

	isImageExtension: (path: ImagePath): boolean => {
		const extension = imagePathValidationRules.extractExtension(path);
		const validExtensions = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
		return validExtensions.includes(extension);
	},

	generateThumbnailPath: (path: ImagePath): string => {
		const pathString = ImagePath.unwrap(path);
		const extension = imagePathValidationRules.extractExtension(path);
		const basePath = pathString.substring(0, pathString.lastIndexOf("."));
		return `${basePath}_thumb.${extension}`;
	},
} as const;
