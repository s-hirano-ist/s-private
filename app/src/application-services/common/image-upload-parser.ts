import {
	UploadFileNotAllowedError,
	type UploadFileNotAllowedReason,
} from "@/common/error/upload-file-not-allowed-error";
import { photonImageProcessor } from "@/infrastructures/images/services/photon-image-processor";

const SUPPORTED_IMAGE_FORMAT_TO_CONTENT_TYPE = new Map<string, string>([
	["jpeg", "image/jpeg"],
	["png", "image/png"],
	["webp", "image/webp"],
]);

type ImageSignatureMatcher = Readonly<{
	contentType: string;
	matches: (bytes: Uint8Array) => boolean;
}>;

function startsWithBytes(
	bytes: Uint8Array,
	signature: readonly number[],
): boolean {
	return (
		bytes.length >= signature.length &&
		signature.every((b, i) => bytes[i] === b)
	);
}

function startsWithAscii(bytes: Uint8Array, value: string): boolean {
	return value.split("").every((char, i) => bytes[i] === char.codePointAt(0));
}

const IMAGE_SIGNATURE_MATCHERS: readonly ImageSignatureMatcher[] = [
	{
		contentType: "image/jpeg",
		matches: (buffer) => startsWithBytes(buffer, [0xff, 0xd8, 0xff]),
	},
	{
		contentType: "image/png",
		matches: (buffer) =>
			startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
	},
	{
		contentType: "image/webp",
		matches: (bytes) =>
			bytes.length >= 12 &&
			startsWithAscii(bytes, "RIFF") &&
			startsWithAscii(bytes.subarray(8, 12), "WEBP"),
	},
];

function createUploadFileNotAllowedError(
	file: File,
	reason: UploadFileNotAllowedReason,
	options?: Readonly<{
		detectedContentType?: string;
		decodedFormat?: string;
		cause?: unknown;
	}>,
): UploadFileNotAllowedError {
	const causeMessage =
		options?.cause instanceof Error ? options.cause.message : undefined;

	return new UploadFileNotAllowedError({
		reason,
		fileName: file.name,
		fileSize: file.size,
		declaredContentType: file.type,
		detectedContentType: options?.detectedContentType,
		decodedFormat: options?.decodedFormat,
		causeMessage,
	});
}

function detectContentTypeFromMagicBytes(
	bytes: Uint8Array,
): string | undefined {
	if (bytes.length === 0) {
		return undefined;
	}

	return IMAGE_SIGNATURE_MATCHERS.find((matcher) => matcher.matches(bytes))
		?.contentType;
}

function toSupportedImageContentType(
	file: File,
	format: string | undefined,
	detectedContentType: string,
): string {
	if (format === undefined) {
		throw createUploadFileNotAllowedError(file, "metadata-format-missing", {
			detectedContentType,
		});
	}

	const contentType = SUPPORTED_IMAGE_FORMAT_TO_CONTENT_TYPE.get(format);

	if (contentType === undefined) {
		throw createUploadFileNotAllowedError(file, "metadata-format-unsupported", {
			detectedContentType,
			decodedFormat: format,
		});
	}

	if (contentType !== detectedContentType) {
		throw createUploadFileNotAllowedError(file, "detected-format-mismatch", {
			detectedContentType,
			decodedFormat: format,
		});
	}

	return contentType;
}

export async function parseSupportedImageFile(file: File): Promise<{
	contentType: string;
	originalBuffer: Uint8Array;
	thumbnailBuffer: Uint8Array;
}> {
	const originalBuffer = await photonImageProcessor.fileToBytes(file);

	if (originalBuffer.length === 0) {
		throw createUploadFileNotAllowedError(file, "empty-buffer");
	}

	const detectedContentType = detectContentTypeFromMagicBytes(originalBuffer);
	if (detectedContentType === undefined) {
		throw createUploadFileNotAllowedError(file, "unsupported-signature");
	}

	let decodedFormat: string | undefined;
	try {
		const metadata = await photonImageProcessor.getMetadata(originalBuffer);
		decodedFormat = metadata.format;
	} catch (error) {
		throw createUploadFileNotAllowedError(file, "metadata-read-failed", {
			detectedContentType,
			cause: error,
		});
	}

	const contentType = toSupportedImageContentType(
		file,
		decodedFormat,
		detectedContentType,
	);

	try {
		const thumbnailBuffer = await photonImageProcessor.createThumbnail(
			originalBuffer,
			192,
			192,
		);

		return { contentType, originalBuffer, thumbnailBuffer };
	} catch (error) {
		throw createUploadFileNotAllowedError(file, "thumbnail-creation-failed", {
			detectedContentType,
			decodedFormat,
			cause: error,
		});
	}
}
