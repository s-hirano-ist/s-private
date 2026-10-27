import type { MobileChunkStore } from "@s-hirano-ist/s-application/mobile/ports";
import type { createObjectStorageClient } from "@s-hirano-ist/s-storage";

export function createMobileChunkStore(
	storageClient: ReturnType<typeof createObjectStorageClient>,
	bucketName: string,
): MobileChunkStore {
	return {
		async put(objectKey, bytes) {
			await storageClient.putObject(bucketName, objectKey, Buffer.from(bytes));
		},
		async get(objectKey) {
			const stream = await storageClient.getObject(bucketName, objectKey);
			const buffers: Buffer[] = [];
			for await (const chunk of stream)
				buffers.push(Buffer.from(chunk as Uint8Array));
			return Buffer.concat(buffers);
		},
		async remove(objectKey) {
			await storageClient.removeObject(bucketName, objectKey);
		},
	};
}
