import type { createMinioClient } from "@s-hirano-ist/s-storage";
import type { MobileChunkStore } from "s-private-backend/mobile/ports";

function objectKey(uploadId: string, part: number): string {
	return `mobile-uploads/${uploadId}/${part}`;
}

export function createMobileChunkStore(
	minioClient: ReturnType<typeof createMinioClient>,
	bucketName: string,
): MobileChunkStore {
	return {
		async put(uploadId, part, bytes) {
			await minioClient.putObject(
				bucketName,
				objectKey(uploadId, part),
				Buffer.from(bytes),
			);
		},
		async get(uploadId, part) {
			const stream = await minioClient.getObject(
				bucketName,
				objectKey(uploadId, part),
			);
			const buffers: Buffer[] = [];
			for await (const chunk of stream)
				buffers.push(Buffer.from(chunk as Uint8Array));
			return Buffer.concat(buffers);
		},
		async remove(uploadId, part) {
			await minioClient.removeObject(bucketName, objectKey(uploadId, part));
		},
	};
}
