import { sharpImageProcessor } from "@/infrastructures/images/services/sharp-image-processor";
import { FileNotAllowedError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";

const SUPPORTED_IMAGE_FORMAT_TO_CONTENT_TYPE = new Map<string, string>([
	["jpeg", "image/jpeg"],
	["png", "image/png"],
	["gif", "image/gif"],
	["webp", "image/webp"],
]);

function toSupportedImageContentType(format: string | undefined): string {
	if (format === undefined) {
		throw new FileNotAllowedError();
	}

	const contentType = SUPPORTED_IMAGE_FORMAT_TO_CONTENT_TYPE.get(format);

	if (contentType === undefined) {
		throw new FileNotAllowedError();
	}

	return contentType;
}

export async function parseSupportedImageFile(file: File): Promise<{
	contentType: string;
	originalBuffer: Buffer;
}> {
	const originalBuffer = await sharpImageProcessor.fileToBuffer(file);

	try {
		const metadata = await sharpImageProcessor.getMetadata(originalBuffer);
		const contentType = toSupportedImageContentType(metadata.format);

		return { contentType, originalBuffer };
	} catch (error) {
		if (error instanceof FileNotAllowedError) {
			throw error;
		}

		throw new FileNotAllowedError();
	}
}
