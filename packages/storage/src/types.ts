import type { Client } from "minio";

export type StorageClientConfig = {
	accessKey: string;
	endPoint: string;
	port: number;
	secretKey: string;
	useSSL: boolean;
};

export type CfAccessConfig = {
	clientId: string;
	clientSecret: string;
};

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

export type MinioClient = Client;
