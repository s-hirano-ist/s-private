import { ImageType } from "@/components/card/viewer-preview";
import { UnexpectedError } from "@/error-classes";

const bufferToBase64 = (buffer: Uint8Array) => {
	let binary = "";
	for (const byte of buffer) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary);
};

export function convertUint8ArrayToImgSrc(
	uint8Array: Uint8Array,
	imageType: ImageType,
) {
	const svgString = new TextDecoder().decode(uint8Array);
	const base64String = bufferToBase64(uint8Array);
	switch (imageType) {
		case "svg":
			return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
		case "webp":
			return `data:image/webp;base64,${base64String}`;
		default:
			imageType satisfies never;
			throw new UnexpectedError();
	}
}
