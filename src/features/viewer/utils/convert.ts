import { UnexpectedError } from "@/error-classes";
import type { ImageType } from "../types";

const bufferToBase64 = (buffer: Uint8Array) => {
	let binary = "";
	for (const byte of buffer) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary);
};

export function convertUnit8ArrayToImgSrc(
	unit8Array: Uint8Array,
	imageType: ImageType,
) {
	const svgString = new TextDecoder().decode(unit8Array);
	const base64String = bufferToBase64(unit8Array);
	switch (imageType) {
		case "svg":
			return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

		case "webp":
			return `data:image/webp;base64,${base64String}`;

		default:
			throw new UnexpectedError();
	}
}
