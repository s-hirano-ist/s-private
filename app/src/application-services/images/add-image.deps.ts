import type { CreateImageDeps as BackendDeps } from "@s-hirano-ist/s-backend/images/use-cases";
/**
 * Dependency types and defaults for image upload.
 *
 * @remarks
 * Separated from add-image.ts to avoid "use server" export restrictions.
 * Only async functions can be exported from server action files.
 *
 * @module
 */
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { domainServiceFactory } from "@/infrastructures/factories/domain-service-factory";
import { imagesCommandRepository } from "@/infrastructures/images/repositories/images-command-repository";
import { minioStorageService } from "@/infrastructures/shared/storage/minio-storage-service";

/**
 * Dependencies for the addImageCore function.
 */
export type AddImageDeps = BackendDeps;

/**
 * Default dependencies for production use.
 */
export const defaultAddImageDeps: AddImageDeps = {
	commandRepository: imagesCommandRepository,
	storageService: minioStorageService,
	domainServiceFactory: domainServiceFactory,
	eventDispatcher: eventDispatcher,
};
