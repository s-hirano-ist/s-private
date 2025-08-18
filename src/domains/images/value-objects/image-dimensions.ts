import { z } from "zod";
import {
	createBrandedType,
	PositiveNumber,
} from "@/domains/common/value-objects";

const imageDimensionsSchema = z
	.object({
		width: PositiveNumber.schema.nullable().optional(),
		height: PositiveNumber.schema.nullable().optional(),
		fileSize: PositiveNumber.schema.nullable().optional(),
	})
	.strict();

export const ImageDimensions = createBrandedType(
	"ImageDimensions",
	imageDimensionsSchema,
);
export type ImageDimensions = ReturnType<typeof ImageDimensions.create>;

export const imageDimensionsValidationRules = {
	calculateAspectRatio: (dimensions: ImageDimensions): number | null => {
		const { width, height } = ImageDimensions.unwrap(dimensions);
		if (width && height && width > 0 && height > 0) {
			return width / height;
		}
		return null;
	},

	isLandscape: (dimensions: ImageDimensions): boolean => {
		const aspectRatio =
			imageDimensionsValidationRules.calculateAspectRatio(dimensions);
		return aspectRatio !== null && aspectRatio > 1;
	},

	isPortrait: (dimensions: ImageDimensions): boolean => {
		const aspectRatio =
			imageDimensionsValidationRules.calculateAspectRatio(dimensions);
		return aspectRatio !== null && aspectRatio < 1;
	},

	isSquare: (dimensions: ImageDimensions): boolean => {
		const aspectRatio =
			imageDimensionsValidationRules.calculateAspectRatio(dimensions);
		return aspectRatio !== null && Math.abs(aspectRatio - 1) < 0.01;
	},

	calculateThumbnailDimensions: (
		dimensions: ImageDimensions,
		maxSize: number = 192,
	): { width: number; height: number } | null => {
		const { width, height } = ImageDimensions.unwrap(dimensions);
		if (!width || !height || width <= 0 || height <= 0) {
			return null;
		}

		const aspectRatio = width / height;

		if (width > height) {
			return {
				width: maxSize,
				height: Math.round(maxSize / aspectRatio),
			};
		} else {
			return {
				width: Math.round(maxSize * aspectRatio),
				height: maxSize,
			};
		}
	},

	formatFileSize: (dimensions: ImageDimensions): string => {
		const { fileSize } = ImageDimensions.unwrap(dimensions);
		if (!fileSize || fileSize <= 0) {
			return "Unknown size";
		}

		const units = ["B", "KB", "MB", "GB"];
		let size = fileSize;
		let unitIndex = 0;

		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024;
			unitIndex++;
		}

		return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
	},

	isHighResolution: (dimensions: ImageDimensions): boolean => {
		const { width, height } = ImageDimensions.unwrap(dimensions);
		if (!width || !height) return false;

		const totalPixels = width * height;
		return totalPixels > 1920 * 1080; // Anything above Full HD
	},
} as const;
