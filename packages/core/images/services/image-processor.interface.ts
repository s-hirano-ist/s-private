/**
 * Image metadata extracted from image buffers.
 */
export type ImageMetadata = {
	/** Width in pixels */
	width?: number;
	/** Height in pixels */
	height?: number;
	/** Image format (e.g., "jpeg", "png", "webp") */
	format?: string;
};

/**
 * Interface for image processing operations.
 *
 * @remarks
 * Abstracts image manipulation operations from the domain layer.
 * Implementations should be provided by the infrastructure layer
 * (e.g., using Photon, Jimp, or other image libraries).
 *
 * This follows the dependency inversion principle - the domain layer
 * defines what operations are needed, while the infrastructure layer
 * provides the implementation.
 *
 * @example
 * ```typescript
 * // Infrastructure implementation
 * class PhotonImageProcessor implements IImageProcessor {
 *   async createThumbnail(bytes: Uint8Array, width: number, height: number) {
 *     return await createWebpThumbnail(bytes, { width, height });
 *   }
 *
 *   async getMetadata(bytes: Uint8Array) {
 *     const metadata = await readImageMetadata(bytes);
 *     return {
 *       width: metadata.width,
 *       height: metadata.height,
 *       format: metadata.format,
 *     };
 *   }
 * }
 * ```
 */
export type IImageProcessor = {
	/**
	 * Creates a thumbnail from an image buffer.
	 *
	 * @param bytes - The original image bytes
	 * @param width - Target thumbnail width in pixels
	 * @param height - Target thumbnail height in pixels
	 * @returns The resized WebP thumbnail bytes
	 */
	createThumbnail(
		bytes: Uint8Array,
		width: number,
		height: number,
	): Promise<Uint8Array>;

	/**
	 * Extracts metadata from an image buffer.
	 *
	 * @param bytes - The image bytes to analyze
	 * @returns Extracted metadata including dimensions and format
	 */
	getMetadata(bytes: Uint8Array): Promise<ImageMetadata>;

	/**
	 * Converts a File object to bytes.
	 *
	 * @param file - The File object to convert
	 * @returns The file data bytes
	 */
	fileToBytes(file: File): Promise<Uint8Array>;
};
