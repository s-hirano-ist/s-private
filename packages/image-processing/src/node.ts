import type {
	ConvertToWebpOptions,
	ImageMetadata,
	ThumbnailOptions,
} from "./shared.ts";
import sharp from "sharp";
import { detectSupportedImageFormat, fileToBytes } from "./shared.ts";

export { detectSupportedImageFormat, fileToBytes } from "./shared.ts";
export type {
	ConvertToWebpOptions,
	ImageMetadata,
	SupportedImageFormat,
	ThumbnailOptions,
} from "./shared.ts";

const DEFAULT_WEBP_QUALITY = 80;

function assertSupportedImage(bytes: Uint8Array) {
	const format = detectSupportedImageFormat(bytes);
	if (format === undefined) {
		throw new Error("Unsupported image signature.");
	}
	return format;
}

export async function readImageMetadata(
	bytes: Uint8Array,
): Promise<ImageMetadata> {
	const format = assertSupportedImage(bytes);
	const metadata = await sharp(bytes).metadata();
	const dimensions = metadata.autoOrient;

	if (!dimensions.width || !dimensions.height) {
		throw new Error("Image dimensions could not be determined.");
	}

	return {
		format,
		height: dimensions.height,
		width: dimensions.width,
	};
}

export async function createWebpThumbnail(
	bytes: Uint8Array,
	options: ThumbnailOptions,
): Promise<Uint8Array> {
	assertSupportedImage(bytes);
	const output = await sharp(bytes)
		.autoOrient()
		.resize(options.width, options.height, {
			fit: "cover",
			kernel: sharp.kernel.lanczos3,
			position: "centre",
		})
		.webp({ quality: DEFAULT_WEBP_QUALITY })
		.toBuffer();

	return new Uint8Array(output);
}

export async function convertToWebp(
	bytes: Uint8Array,
	options?: ConvertToWebpOptions,
): Promise<Uint8Array> {
	assertSupportedImage(bytes);
	const output = await sharp(bytes)
		.autoOrient()
		.webp({ quality: options?.quality ?? DEFAULT_WEBP_QUALITY })
		.toBuffer();

	return new Uint8Array(output);
}
