import {
	UploadFileNotAllowedError,
	type UploadFileNotAllowedReason,
} from "@/common/error/upload-file-not-allowed-error";
import { sharpImageProcessor } from "@/infrastructures/images/services/sharp-image-processor";

const SUPPORTED_IMAGE_FORMAT_TO_CONTENT_TYPE = new Map<string, string>([
	["jpeg", "image/jpeg"],
	["png", "image/png"],
	["gif", "image/gif"],
	["webp", "image/webp"],
]);

type ImageSignatureMatcher = Readonly<{
	contentType: string;
	matches: (buffer: Buffer) => boolean;
}>;

function startsWithBytes(buffer: Buffer, bytes: readonly number[]): boolean {
	return (
		buffer.length >= bytes.length && bytes.every((b, i) => buffer[i] === b)
	);
}

function startsWithAscii(buffer: Buffer, value: string): boolean {
	return buffer.subarray(0, value.length).equals(Buffer.from(value, "ascii"));
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
		contentType: "image/gif",
		matches: (buffer) =>
			startsWithAscii(buffer, "GIF87a") || startsWithAscii(buffer, "GIF89a"),
	},
	{
		contentType: "image/webp",
		matches: (buffer) =>
			buffer.length >= 12 &&
			startsWithAscii(buffer, "RIFF") &&
			buffer.subarray(8, 12).equals(Buffer.from("WEBP", "ascii")),
	},
];

function createUploadFileNotAllowedError(
	file: File,
	reason: UploadFileNotAllowedReason,
	options?: Readonly<{
		detectedContentType?: string;
		sharpFormat?: string;
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
		sharpFormat: options?.sharpFormat,
		causeMessage,
	});
}

function detectContentTypeFromMagicBytes(buffer: Buffer): string | undefined {
	if (buffer.length === 0) {
		return undefined;
	}

	return IMAGE_SIGNATURE_MATCHERS.find((matcher) => matcher.matches(buffer))
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
			sharpFormat: format,
		});
	}

	if (contentType !== detectedContentType) {
		throw createUploadFileNotAllowedError(file, "detected-format-mismatch", {
			detectedContentType,
			sharpFormat: format,
		});
	}

	return contentType;
}

export async function parseSupportedImageFile(file: File): Promise<{
	contentType: string;
	originalBuffer: Buffer;
	thumbnailBuffer: Buffer;
}> {
	const originalBuffer = await sharpImageProcessor.fileToBuffer(file);

	if (originalBuffer.length === 0) {
		throw createUploadFileNotAllowedError(file, "empty-buffer");
	}

	const detectedContentType = detectContentTypeFromMagicBytes(originalBuffer);
	if (detectedContentType === undefined) {
		throw createUploadFileNotAllowedError(file, "unsupported-signature");
	}

	let sharpFormat: string | undefined;
	try {
		const metadata = await sharpImageProcessor.getMetadata(originalBuffer);
		sharpFormat = metadata.format;
	} catch (error) {
		throw createUploadFileNotAllowedError(file, "metadata-read-failed", {
			detectedContentType,
			cause: error,
		});
	}

	const contentType = toSupportedImageContentType(
		file,
		sharpFormat,
		detectedContentType,
	);

	try {
		const thumbnailBuffer = await sharpImageProcessor.createThumbnail(
			originalBuffer,
			192,
			192,
		);

		return { contentType, originalBuffer, thumbnailBuffer };
	} catch (error) {
		throw createUploadFileNotAllowedError(file, "thumbnail-creation-failed", {
			detectedContentType,
			sharpFormat,
			cause: error,
		});
	}
}
