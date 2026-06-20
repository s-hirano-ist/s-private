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
import type sharp from "sharp";

type SharpFactory = typeof sharp;

let sharpFactoryPromise: Promise<SharpFactory> | undefined;

async function loadSharp(): Promise<SharpFactory> {
	sharpFactoryPromise ??= import("sharp").then((module) => module.default);

	return sharpFactoryPromise;
}

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
	const sharp = await loadSharp();
	return await sharp(buffer, { autoOrient: true, failOn: "none" })
		.resize(width, height)
		.toBuffer();
}

async function getMetadata(buffer: Buffer): Promise<ImageMetadata> {
	const sharp = await loadSharp();
	const metadata = await sharp(buffer, {
		autoOrient: true,
		failOn: "none",
	}).metadata();
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
