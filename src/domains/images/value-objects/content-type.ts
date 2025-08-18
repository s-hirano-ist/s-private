import { z } from "zod";
import { createBrandedType } from "@/domains/common/value-objects";

const contentTypeSchema = z
	.string()
	.regex(
		/^image\/(jpeg|jpg|png|gif|webp|bmp|svg\+xml)$/,
		"Invalid image content type",
	);

export const ContentType = createBrandedType("ContentType", contentTypeSchema);
export type ContentType = ReturnType<typeof ContentType.create>;

export const contentTypeValidationRules = {
	isImageType: (value: string): boolean => {
		return /^image\//.test(value);
	},

	isValidImageType: (value: string): boolean => {
		return /^image\/(jpeg|jpg|png|gif|webp|bmp|svg\+xml)$/.test(value);
	},

	extractMainType: (contentType: ContentType): string => {
		const type = ContentType.unwrap(contentType);
		return type.split("/")[0];
	},

	extractSubType: (contentType: ContentType): string => {
		const type = ContentType.unwrap(contentType);
		return type.split("/")[1];
	},

	getFileExtension: (contentType: ContentType): string => {
		const type = ContentType.unwrap(contentType);
		const extensionMap: Record<string, string> = {
			"image/jpeg": "jpg",
			"image/jpg": "jpg",
			"image/png": "png",
			"image/gif": "gif",
			"image/webp": "webp",
			"image/bmp": "bmp",
			"image/svg+xml": "svg",
		};
		return extensionMap[type] || "";
	},

	fromFileExtension: (extension: string): string => {
		const typeMap: Record<string, string> = {
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
			gif: "image/gif",
			webp: "image/webp",
			bmp: "image/bmp",
			svg: "image/svg+xml",
		};
		return typeMap[extension.toLowerCase()] || "";
	},

	supportsCompression: (contentType: ContentType): boolean => {
		const type = ContentType.unwrap(contentType);
		return ["image/jpeg", "image/jpg", "image/webp"].includes(type);
	},
} as const;
