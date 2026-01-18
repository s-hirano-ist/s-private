/**
 * Dependency types and defaults for image upload.
 *
 * @remarks
 * Separated from add-image.ts to avoid "use server" export restrictions.
 * Only async functions can be exported from server action files.
 *
 * @module
 */

import type { IStorageService } from "@s-hirano-ist/s-core/common/services/storage-service.interface";
import type { IImagesCommandRepository } from "@s-hirano-ist/s-core/images/repositories/images-command-repository.interface";
import type { IImagesQueryRepository } from "@s-hirano-ist/s-core/images/repositories/images-query-repository.interface";
import { ImagesDomainService } from "@s-hirano-ist/s-core/images/services/images-domain-service";
import { minioStorageService } from "@/infrastructures/common/services/minio-storage-service";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { imagesCommandRepository } from "@/infrastructures/images/repositories/images-command-repository";
import { imagesQueryRepository } from "@/infrastructures/images/repositories/images-query-repository";
import type { IEventDispatcher } from "../articles/add-article.deps";

/**
 * Dependencies for the addImageCore function.
 */
export type AddImageDeps = {
	commandRepository: IImagesCommandRepository;
	queryRepository: IImagesQueryRepository;
	storageService: IStorageService;
	eventDispatcher: IEventDispatcher;
};

/**
 * Default dependencies for production use.
 */
export const defaultAddImageDeps: AddImageDeps = {
	commandRepository: imagesCommandRepository,
	queryRepository: imagesQueryRepository,
	storageService: minioStorageService,
	eventDispatcher: eventDispatcher,
};

/**
 * Creates an ImagesDomainService with the given query repository.
 *
 * @param queryRepository - The query repository for duplicate checking
 * @returns A new ImagesDomainService instance
 */
export function createImagesDomainService(
	queryRepository: IImagesQueryRepository,
): ImagesDomainService {
	return new ImagesDomainService(queryRepository);
}
