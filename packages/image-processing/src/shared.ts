export type SupportedImageFormat = "jpeg" | "png" | "webp";

export type ImageMetadata = {
	format: SupportedImageFormat;
	height: number;
	width: number;
};

export type ThumbnailOptions = {
	height: number;
	width: number;
};

export type ConvertToWebpOptions = {
	quality?: number;
};

const WEBP_HEADER_OFFSET = 8;
const RIFF_HEADER_LENGTH = 12;

function startsWithBytes(
	bytes: Uint8Array,
	signature: readonly number[],
): boolean {
	return (
		bytes.length >= signature.length &&
		signature.every((byte, index) => bytes[index] === byte)
	);
}

function startsWithAscii(bytes: Uint8Array, value: string): boolean {
	if (bytes.length < value.length) {
		return false;
	}

	for (let index = 0; index < value.length; index++) {
		if (bytes[index] !== value.codePointAt(index)) {
			return false;
		}
	}

	return true;
}

export function detectSupportedImageFormat(
	bytes: Uint8Array,
): SupportedImageFormat | undefined {
	if (startsWithBytes(bytes, [0xff, 0xd8, 0xff])) {
		return "jpeg";
	}

	if (
		startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
	) {
		return "png";
	}

	if (
		bytes.length >= RIFF_HEADER_LENGTH &&
		startsWithAscii(bytes, "RIFF") &&
		bytes[WEBP_HEADER_OFFSET] === "W".codePointAt(0) &&
		bytes[WEBP_HEADER_OFFSET + 1] === "E".codePointAt(0) &&
		bytes[WEBP_HEADER_OFFSET + 2] === "B".codePointAt(0) &&
		bytes[WEBP_HEADER_OFFSET + 3] === "P".codePointAt(0)
	) {
		return "webp";
	}

	return undefined;
}

export async function fileToBytes(file: File): Promise<Uint8Array> {
	return new Uint8Array(await file.arrayBuffer());
}
