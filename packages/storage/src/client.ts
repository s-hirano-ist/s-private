import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	DeleteObjectCommand,
	paginateListObjectsV2,
} from "@aws-sdk/client-s3";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export type StorageClientConfig = {
	accessKeyId: string;
	endpoint: string;
	forcePathStyle: boolean;
	region: string;
	secretAccessKey: string;
};

export function loadStorageConfig(
	env: Record<string, string | undefined> = process.env,
): StorageClientConfig {
	const required = (key: string): string => {
		const value = env[key];
		if (!value) throw new Error(`${key} is required`);
		return value;
	};
	const endpoint = required("S3_ENDPOINT");
	const url = new URL(endpoint);
	if (
		!["http:", "https:"].includes(url.protocol) ||
		url.username ||
		url.password ||
		url.search ||
		url.hash ||
		url.pathname !== "/"
	)
		throw new Error("S3_ENDPOINT must be an HTTP(S) origin");
	const pathStyle = env.S3_FORCE_PATH_STYLE ?? "false";
	if (pathStyle !== "true" && pathStyle !== "false")
		throw new Error("S3_FORCE_PATH_STYLE must be true or false");
	return {
		endpoint,
		region: required("S3_REGION"),
		accessKeyId: required("S3_ACCESS_KEY_ID"),
		secretAccessKey: required("S3_SECRET_ACCESS_KEY"),
		forcePathStyle: pathStyle === "true",
	};
}

export function isObjectNotFound(error: unknown): boolean {
	if (typeof error !== "object" || error === null) return false;
	const value = error as {
		$metadata?: { httpStatusCode?: number };
		name?: string;
	};
	return (
		value.$metadata?.httpStatusCode === 404 &&
		(value.name === "NotFound" || value.name === "NoSuchKey")
	);
}

export function createObjectStorageClient(config = loadStorageConfig()) {
	const client = new S3Client({
		endpoint: config.endpoint,
		region: config.region,
		credentials: {
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
		},
		forcePathStyle: config.forcePathStyle,
	});
	return {
		async putObject(bucket: string, key: string, body: Uint8Array) {
			const result = await client.send(
				new PutObjectCommand({ Bucket: bucket, Key: key, Body: body }),
			);
			return { etag: result.ETag, versionId: result.VersionId };
		},
		async getObject(bucket: string, key: string): Promise<Readable> {
			const result = await client.send(
				new GetObjectCommand({ Bucket: bucket, Key: key }),
			);
			if (!(result.Body instanceof Readable))
				throw new Error("Object storage returned no Node readable body");
			return result.Body;
		},
		async downloadObject(
			bucket: string,
			key: string,
			destination: string,
		): Promise<void> {
			const result = await client.send(
				new GetObjectCommand({ Bucket: bucket, Key: key }),
			);
			if (!(result.Body instanceof Readable))
				throw new Error("Object storage returned no Node readable body");
			await pipeline(result.Body, createWriteStream(destination));
		},

		async statObject(bucket: string, key: string) {
			const result = await client.send(
				new HeadObjectCommand({ Bucket: bucket, Key: key }),
			);
			return {
				size: result.ContentLength,
				etag: result.ETag,
				lastModified: result.LastModified,
				metaData: result.Metadata ?? {},
			};
		},
		async removeObject(bucket: string, key: string): Promise<void> {
			await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
		},
		async listObjects(bucket: string, prefix: string): Promise<string[]> {
			const keys: string[] = [];
			for await (const page of paginateListObjectsV2(
				{ client },
				{ Bucket: bucket, Prefix: prefix },
			)) {
				for (const object of page.Contents ?? [])
					if (object.Key) keys.push(object.Key);
			}
			return keys;
		},
		destroy() {
			client.destroy();
		},
	};
}
export type ObjectStorageClient = ReturnType<typeof createObjectStorageClient>;
