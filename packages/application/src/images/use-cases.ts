import type { MediaCreationInput } from "@s-hirano-ist/s-application/content/media-input";
import type { IStorageService } from "@s-hirano-ist/s-application/content/storage-port";
import type { EventDispatcher } from "@s-hirano-ist/s-application/events/ports";
import type { IImagesCommandRepository } from "@s-hirano-ist/s-core/images/repositories/images-command-repository.interface";
import type { ImagesDomainService } from "@s-hirano-ist/s-core/images/services/images-domain-service";
import {
	withOperationPhase,
	type OperationPhaseContext,
} from "@s-hirano-ist/s-application/diagnostics/operation-phase-error";
import { withStoragePhase } from "@s-hirano-ist/s-application/diagnostics/storage-phase-error";
import { imageEntity } from "@s-hirano-ist/s-core/images/entities/image-entity";
import { ImageDeletedEvent } from "@s-hirano-ist/s-core/images/events/image-deleted-event";
import {
	makeUnexportedStatus,
	type Id,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
export type DeleteImageDeps = {
	commandRepository: IImagesCommandRepository;
	eventDispatcher: EventDispatcher;
};
export type CreateImageDeps = DeleteImageDeps & {
	domainServiceFactory: {
		createImagesDomainService(): Pick<ImagesDomainService, "ensureNoDuplicate">;
	};
	storageService: IStorageService;
};
export async function createImage(
	parsedData: MediaCreationInput,
	deps: CreateImageDeps,
	phaseContext: Omit<OperationPhaseContext, "phase">,
) {
	const {
		commandRepository,
		storageService,
		domainServiceFactory,
		eventDispatcher,
	} = deps;
	const imagesDomainService = domainServiceFactory.createImagesDomainService();
	const {
		userId,
		path,
		contentType,
		fileSize,
		thumbnailBuffer,
		originalBuffer,
	} = parsedData;

	// Domain business rule validation
	await withOperationPhase({ ...phaseContext, phase: "validate-domain" }, () =>
		imagesDomainService.ensureNoDuplicate(path, userId),
	);

	// Create entity with value objects and domain event
	const [image, event] = await withOperationPhase(
		{ ...phaseContext, phase: "create-entity" },
		async () =>
			imageEntity.create({
				userId,
				path,
				contentType,
				fileSize,
				caller: "addImage",
			}),
	);

	const storageContext = {
		action: "addImage",
		path,
		fileSize,
		contentType,
	};

	await withStoragePhase(
		{
			phase: "upload-original",
			path: image.path,
			isThumbnail: false,
			additionalContext: storageContext,
		},
		() => storageService.uploadImage(image.path, originalBuffer, false),
	);
	await withStoragePhase(
		{
			phase: "upload-thumbnail",
			path: image.path,
			isThumbnail: true,
			additionalContext: storageContext,
		},
		() => storageService.uploadImage(image.path, thumbnailBuffer, true),
	);
	// Cache invalidation is handled in repository
	await withOperationPhase({ ...phaseContext, phase: "create-record" }, () =>
		commandRepository.create(image),
	);

	// Dispatch domain event
	await withOperationPhase({ ...phaseContext, phase: "dispatch-event" }, () =>
		eventDispatcher.dispatch(event),
	);

	return { id: image.id };
}
export async function deleteImage(
	id: Id,
	userId: UserId,
	deps: DeleteImageDeps,
): Promise<void> {
	const { commandRepository, eventDispatcher } = deps;
	const status = makeUnexportedStatus();
	// Cache invalidation is handled in repository
	const { path } = await commandRepository.deleteById(id, userId, status);

	// Dispatch domain event
	await eventDispatcher.dispatch(
		new ImageDeletedEvent({
			path,
			userId: userId,
			caller: "deleteImage",
		}),
	);
}
