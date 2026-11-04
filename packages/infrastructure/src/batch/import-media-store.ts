import type { ImportMediaStore } from "@s-hirano-ist/s-application/batch/import-models";
import type { IImageProcessor } from "@s-hirano-ist/s-application/content/image-processor";
import type { IStorageService } from "@s-hirano-ist/s-application/content/storage-port";
import {
	isObjectNotFound,
	StorageOperationError,
} from "@s-hirano-ist/s-storage";
export function createImportMediaStore(
	storage: { books: IStorageService; images: IStorageService },
	processor: IImageProcessor,
): ImportMediaStore {
	return {
		async put(domain, path, bytes) {
			const target = storage[domain];
			try {
				await target.getImageOrThrow(path, false);
			} catch (error) {
				if (
					!isObjectNotFound(
						error instanceof StorageOperationError ? error.cause : error,
					)
				)
					throw error;
				await target.uploadImage(path, bytes, false);
			}
			await target.uploadImage(
				path,
				await processor.createThumbnail(bytes, 192, 192),
				true,
			);
		},
		async removeImage(path) {
			await storage.images.deleteImage(path, false);
			await storage.images.deleteImage(path, true);
		},
	};
}
