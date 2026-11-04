export type StoragePathConfig = {
	originalPrefix: string;
	thumbnailPrefix: string;
};

export type StorageServiceOperations = {
	deleteImage(path: string, isThumbnail: boolean): Promise<void>;
	getImage(path: string, isThumbnail: boolean): Promise<NodeJS.ReadableStream>;
	getImageOrThrow(path: string, isThumbnail: boolean): Promise<void>;
	uploadImage(
		path: string,
		bytes: Uint8Array,
		isThumbnail: boolean,
	): Promise<void>;
};
