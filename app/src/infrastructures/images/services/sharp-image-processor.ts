/**
 * Sharp-based image processor implementation.
 *
 * @remarks
 * Provides Node-compatible image processing operations through the shared
 * Sharp wrapper. Implements the domain-owned image processor interface.
 *
 * @module
 */

import type {
	IImageProcessor,
	ImageMetadata,
} from "@s-hirano-ist/s-core/images/services/image-processor.interface";
import {
	createWebpThumbnail,
	fileToBytes,
	readImageMetadata,
} from "@s-hirano-ist/s-image-processing/node";

const THUMBNAIL_WIDTH = 192;
const THUMBNAIL_HEIGHT = 192;

async function createThumbnail(
	bytes: Uint8Array,
	width: number = THUMBNAIL_WIDTH,
	height: number = THUMBNAIL_HEIGHT,
): Promise<Uint8Array> {
	return await createWebpThumbnail(bytes, { width, height });
}

async function getMetadata(bytes: Uint8Array): Promise<ImageMetadata> {
	return await readImageMetadata(bytes);
}

export const sharpImageProcessor: IImageProcessor = {
	createThumbnail,
	getMetadata,
	fileToBytes,
};
