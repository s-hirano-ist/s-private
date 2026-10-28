export type ImageMetadata = {
	format?: string;
	height?: number;
	width?: number;
};
export type IImageProcessor = {
	createThumbnail(
		bytes: Uint8Array,
		width: number,
		height: number,
	): Promise<Uint8Array>;
	getMetadata(bytes: Uint8Array): Promise<ImageMetadata>;
};
export type UploadedFile = {
	name: string;
	type: string;
	size: number;
	arrayBuffer(): Promise<ArrayBuffer>;
};
