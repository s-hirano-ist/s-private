import type { Client } from "minio";

export type StorageClientConfig = {
	endPoint: string;
	port: number;
	useSSL: boolean;
	accessKey: string;
	secretKey: string;
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
	uploadImage(
		path: string,
		buffer: Buffer,
		isThumbnail: boolean,
	): Promise<void>;
	getImage(path: string, isThumbnail: boolean): Promise<NodeJS.ReadableStream>;
	getImageOrThrow(path: string, isThumbnail: boolean): Promise<void>;
	deleteImage(path: string, isThumbnail: boolean): Promise<void>;
};

export type MinioClient = Client;
