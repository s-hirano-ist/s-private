import type { MobileChunkStore } from "@/application-services/mobile/ports";
import { env } from "@/env";
import { minioClient } from "@/minio";

function objectKey(uploadId: string, part: number): string {
	return `mobile-uploads/${uploadId}/${part}`;
}

export const minioMobileChunkStore: MobileChunkStore = {
	async put(uploadId, part, bytes) {
		await minioClient.putObject(
			env.MINIO_BUCKET_NAME,
			objectKey(uploadId, part),
			Buffer.from(bytes),
		);
	},
	async get(uploadId, part) {
		const stream = await minioClient.getObject(
			env.MINIO_BUCKET_NAME,
			objectKey(uploadId, part),
		);
		const buffers: Buffer[] = [];
		for await (const chunk of stream)
			buffers.push(Buffer.from(chunk as Uint8Array));
		return Buffer.concat(buffers);
	},
	async remove(uploadId, part) {
		await minioClient.removeObject(
			env.MINIO_BUCKET_NAME,
			objectKey(uploadId, part),
		);
	},
};
