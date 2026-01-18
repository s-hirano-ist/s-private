/**
 * Image metadata extracted from image buffers.
 */
export type ImageMetadata = {
	/** Width in pixels */
	width?: number;
	/** Height in pixels */
	height?: number;
	/** Image format (e.g., "jpeg", "png", "gif") */
	format?: string;
};

/**
 * Interface for image processing operations.
 *
 * @remarks
 * Abstracts image manipulation operations from the domain layer.
 * Implementations should be provided by the infrastructure layer
 * (e.g., using sharp, jimp, or other image libraries).
 *
 * This follows the dependency inversion principle - the domain layer
 * defines what operations are needed, while the infrastructure layer
 * provides the implementation.
 *
 * @example
 * ```typescript
 * // Infrastructure implementation
 * class SharpImageProcessor implements IImageProcessor {
 *   async createThumbnail(buffer: Buffer, width: number, height: number) {
 *     return await sharp(buffer).resize(width, height).toBuffer();
 *   }
 *
 *   async getMetadata(buffer: Buffer) {
 *     const metadata = await sharp(buffer).metadata();
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
	 * @param buffer - The original image buffer
	 * @param width - Target thumbnail width in pixels
	 * @param height - Target thumbnail height in pixels
	 * @returns A buffer containing the resized image
	 */
	createThumbnail(
		buffer: Buffer,
		width: number,
		height: number,
	): Promise<Buffer>;

	/**
	 * Extracts metadata from an image buffer.
	 *
	 * @param buffer - The image buffer to analyze
	 * @returns Extracted metadata including dimensions and format
	 */
	getMetadata(buffer: Buffer): Promise<ImageMetadata>;

	/**
	 * Converts a File object to a Buffer.
	 *
	 * @param file - The File object to convert
	 * @returns A buffer containing the file data
	 */
	fileToBuffer(file: File): Promise<Buffer>;
};
