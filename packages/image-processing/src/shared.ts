export type SupportedImageFormat = "jpeg" | "png" | "webp";

export type ImageMetadata = {
	width: number;
	height: number;
	format: SupportedImageFormat;
};

export type ThumbnailOptions = {
	width: number;
	height: number;
};

export type ConvertToWebpOptions = {
	quality?: number;
};

export type SamplingFilter = number;

export type PhotonImageLike = {
	free(): void;
	get_width(): number;
	get_height(): number;
	get_bytes_webp(): Uint8Array;
};

export type PhotonImageConstructor = {
	new_from_byteslice(bytes: Uint8Array): PhotonImageLike;
};

export type PhotonModule = {
	PhotonImage: PhotonImageConstructor;
	SamplingFilter: { Lanczos3: SamplingFilter };
	crop(
		image: PhotonImageLike,
		x1: number,
		y1: number,
		x2: number,
		y2: number,
	): PhotonImageLike;
	resize(
		image: PhotonImageLike,
		width: number,
		height: number,
		samplingFilter: SamplingFilter,
	): PhotonImageLike;
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

function decodeImage(bytes: Uint8Array, photon: PhotonModule): PhotonImageLike {
	return photon.PhotonImage.new_from_byteslice(bytes);
}

export async function fileToBytes(file: File): Promise<Uint8Array> {
	return new Uint8Array(await file.arrayBuffer());
}

export function readImageMetadataWithPhoton(
	bytes: Uint8Array,
	photon: PhotonModule,
): ImageMetadata {
	const format = detectSupportedImageFormat(bytes);
	if (format === undefined) {
		throw new Error("Unsupported image signature.");
	}

	const image = decodeImage(bytes, photon);
	try {
		return {
			width: image.get_width(),
			height: image.get_height(),
			format,
		};
	} finally {
		image.free();
	}
}

function getCoverCropBounds(
	sourceWidth: number,
	sourceHeight: number,
	targetWidth: number,
	targetHeight: number,
): { x1: number; y1: number; x2: number; y2: number } {
	const sourceRatio = sourceWidth / sourceHeight;
	const targetRatio = targetWidth / targetHeight;

	if (sourceRatio > targetRatio) {
		const cropWidth = Math.max(1, Math.round(sourceHeight * targetRatio));
		const x1 = Math.floor((sourceWidth - cropWidth) / 2);
		return { x1, y1: 0, x2: x1 + cropWidth, y2: sourceHeight };
	}

	const cropHeight = Math.max(1, Math.round(sourceWidth / targetRatio));
	const y1 = Math.floor((sourceHeight - cropHeight) / 2);
	return { x1: 0, y1, x2: sourceWidth, y2: y1 + cropHeight };
}

export function createWebpThumbnailWithPhoton(
	bytes: Uint8Array,
	options: ThumbnailOptions,
	photon: PhotonModule,
): Uint8Array {
	const source = decodeImage(bytes, photon);
	let cropped: PhotonImageLike | undefined;
	let resized: PhotonImageLike | undefined;

	try {
		const bounds = getCoverCropBounds(
			source.get_width(),
			source.get_height(),
			options.width,
			options.height,
		);
		cropped = photon.crop(source, bounds.x1, bounds.y1, bounds.x2, bounds.y2);
		resized = photon.resize(
			cropped,
			options.width,
			options.height,
			photon.SamplingFilter.Lanczos3,
		);
		return new Uint8Array(resized.get_bytes_webp());
	} finally {
		resized?.free();
		cropped?.free();
		source.free();
	}
}

export function convertToWebpWithPhoton(
	bytes: Uint8Array,
	photon: PhotonModule,
	_options?: ConvertToWebpOptions,
): Uint8Array {
	const image = decodeImage(bytes, photon);
	try {
		return new Uint8Array(image.get_bytes_webp());
	} finally {
		image.free();
	}
}
