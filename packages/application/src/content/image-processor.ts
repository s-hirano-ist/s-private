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
	arrayBuffer(): Promise<ArrayBuffer>;
	name: string;
	size: number;
	type: string;
};
