/**
 * Sharp-based image processor implementation.
 *
 * @remarks
 * Provides image processing operations using the sharp library.
 * Implements the IImageProcessor interface from the domain layer.
 *
 * @module
 */

import type {
	IImageProcessor,
	ImageMetadata,
} from "@s-hirano-ist/s-core/images/services/image-processor.interface";
import sharp from "sharp";

/**
 * Default thumbnail width in pixels.
 * @internal
 */
const THUMBNAIL_WIDTH = 192;

/**
 * Default thumbnail height in pixels.
 * @internal
 */
const THUMBNAIL_HEIGHT = 192;

async function createThumbnail(
	buffer: Buffer,
	width: number = THUMBNAIL_WIDTH,
	height: number = THUMBNAIL_HEIGHT,
): Promise<Buffer> {
	return await sharp(buffer).resize(width, height).toBuffer();
}

async function getMetadata(buffer: Buffer): Promise<ImageMetadata> {
	const metadata = await sharp(buffer).metadata();
	return {
		width: metadata.width,
		height: metadata.height,
		format: metadata.format,
	};
}

async function fileToBuffer(file: File): Promise<Buffer> {
	return Buffer.from(await file.arrayBuffer());
}

/**
 * Sharp-based implementation of IImageProcessor.
 *
 * @remarks
 * Uses the sharp library for efficient image processing operations
 * including thumbnail generation and metadata extraction.
 */
export const sharpImageProcessor: IImageProcessor = {
	createThumbnail,
	getMetadata,
	fileToBuffer,
};
