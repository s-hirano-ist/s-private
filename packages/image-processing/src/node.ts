import type {
	ConvertToWebpOptions,
	ImageMetadata,
	ThumbnailOptions,
} from "./shared.ts";
import type * as PhotonNode from "@silvia-odwyer/photon-node";
import { createRequire } from "node:module";
import {
	convertToWebpWithPhoton,
	createWebpThumbnailWithPhoton,
	detectSupportedImageFormat,
	fileToBytes,
	readImageMetadataWithPhoton,
} from "./shared.ts";

export { detectSupportedImageFormat, fileToBytes } from "./shared.ts";
export type {
	ConvertToWebpOptions,
	ImageMetadata,
	SupportedImageFormat,
	ThumbnailOptions,
} from "./shared.ts";

const require = createRequire(import.meta.url);
const photon = require("@silvia-odwyer/photon-node") as typeof PhotonNode;

export async function readImageMetadata(
	bytes: Uint8Array,
): Promise<ImageMetadata> {
	return readImageMetadataWithPhoton(bytes, photon);
}

export async function createWebpThumbnail(
	bytes: Uint8Array,
	options: ThumbnailOptions,
): Promise<Uint8Array> {
	return createWebpThumbnailWithPhoton(bytes, options, photon);
}

export async function convertToWebp(
	bytes: Uint8Array,
	options?: ConvertToWebpOptions,
): Promise<Uint8Array> {
	return convertToWebpWithPhoton(bytes, photon, options);
}
