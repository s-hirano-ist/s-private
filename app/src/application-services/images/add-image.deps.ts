/**
 * Dependency types and defaults for image upload.
 *
 * @remarks
 * Separated from add-image.ts to avoid "use server" export restrictions.
 * Only async functions can be exported from server action files.
 *
 * @module
 */

import type { IImagesCommandRepository } from "@s-hirano-ist/s-core/images/repositories/images-command-repository.interface";
import type { IStorageService } from "@s-hirano-ist/s-core/shared-kernel/services/storage-service.interface";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import {
	type createDomainServiceFactory,
	domainServiceFactory,
} from "@/infrastructures/factories/domain-service-factory";
import { imagesCommandRepository } from "@/infrastructures/images/repositories/images-command-repository";
import { minioStorageService } from "@/infrastructures/shared/storage/minio-storage-service";
import type { IEventDispatcher } from "../common/event-dispatcher.interface";

/**
 * Dependencies for the addImageCore function.
 */
export type AddImageDeps = {
	commandRepository: IImagesCommandRepository;
	storageService: IStorageService;
	domainServiceFactory: ReturnType<typeof createDomainServiceFactory>;
	eventDispatcher: IEventDispatcher;
};

/**
 * Default dependencies for production use.
 */
export const defaultAddImageDeps: AddImageDeps = {
	commandRepository: imagesCommandRepository,
	storageService: minioStorageService,
	domainServiceFactory: domainServiceFactory,
	eventDispatcher: eventDispatcher,
};
