import type { MobileChunkStore } from "@s-hirano-ist/s-application/mobile/ports";
import type { createMinioClient } from "@s-hirano-ist/s-storage";

export function createMobileChunkStore(
	minioClient: ReturnType<typeof createMinioClient>,
	bucketName: string,
): MobileChunkStore {
	return {
		async put(objectKey, bytes) {
			await minioClient.putObject(bucketName, objectKey, Buffer.from(bytes));
		},
		async get(objectKey) {
			const stream = await minioClient.getObject(bucketName, objectKey);
			const buffers: Buffer[] = [];
			for await (const chunk of stream)
				buffers.push(Buffer.from(chunk as Uint8Array));
			return Buffer.concat(buffers);
		},
		async remove(objectKey) {
			await minioClient.removeObject(bucketName, objectKey);
		},
	};
}
