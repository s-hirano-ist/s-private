import type { MediaCreationInput } from "@s-hirano-ist/s-application/content/media-input";
import type {
	MediaLock,
	MediaDeletionDeps,
} from "@s-hirano-ist/s-application/content/media-lifecycle";
import type { IStorageService } from "@s-hirano-ist/s-application/content/storage-port";
import type { EventDispatcher } from "@s-hirano-ist/s-application/events/ports";
import type { IImagesCommandRepository } from "@s-hirano-ist/s-core/images/repositories/images-command-repository.interface";
import type { ImagesDomainService } from "@s-hirano-ist/s-core/images/services/images-domain-service";
import {
	withOperationPhase,
	type OperationPhaseContext,
} from "@s-hirano-ist/s-application/diagnostics/operation-phase-error";
import { withStoragePhase } from "@s-hirano-ist/s-application/diagnostics/storage-phase-error";
import {
	directCommit,
	type MutationCommit,
} from "@s-hirano-ist/s-application/transaction";
import { imageEntity } from "@s-hirano-ist/s-core/images/entities/image-entity";
import { ImageDeletedEvent } from "@s-hirano-ist/s-core/images/events/image-deleted-event";
import {
	type Id,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
export type DeleteImageDeps = MediaDeletionDeps & {
	commandRepository: IImagesCommandRepository;
	eventDispatcher: EventDispatcher;
};
export type CreateImageDeps = DeleteImageDeps & {
	domainServiceFactory: {
		createImagesDomainService(): Pick<ImagesDomainService, "ensureNoDuplicate">;
	};
	mediaLock: MediaLock;
	storageService: IStorageService;
};
export async function createImage(
	parsedData: MediaCreationInput,
	deps: CreateImageDeps,
	phaseContext: Omit<OperationPhaseContext, "phase">,
	commit: MutationCommit = directCommit,
) {
	return deps.mediaLock.run("images", parsedData.path, async (assertActive) => {
		const {
			commandRepository,
			storageService,
			domainServiceFactory,
			eventDispatcher,
		} = deps;
		const imagesDomainService =
			domainServiceFactory.createImagesDomainService();
		const {
			userId,
			path,
			contentType,
			fileSize,
			thumbnailBuffer,
			originalBuffer,
		} = parsedData;

		// Domain business rule validation
		await withOperationPhase(
			{ ...phaseContext, phase: "validate-domain" },
			() => imagesDomainService.ensureNoDuplicate(path, userId),
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

		await assertActive();
		await withStoragePhase(
			{
				phase: "upload-original",
				path: image.path,
				isThumbnail: false,
				additionalContext: storageContext,
			},
			() => storageService.uploadImage(image.path, originalBuffer, false),
		);
		await assertActive();
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
		await assertActive();
		await commit(async () => {
			await withOperationPhase(
				{ ...phaseContext, phase: "create-record" },
				() => commandRepository.create(image),
			);
			return image.id;
		});

		// Dispatch domain event
		await withOperationPhase({ ...phaseContext, phase: "dispatch-event" }, () =>
			eventDispatcher.dispatch(event),
		);

		return { id: image.id };
	});
}

export async function deleteImage(
	id: Id,
	userId: UserId,
	deps: DeleteImageDeps,
): Promise<void> {
	const { commandRepository, eventDispatcher } = deps;
	// Cache invalidation is handled in repository
	const { result, jobId } = await deps.transactions.run(async () => {
		const deleted = await commandRepository.deleteById(id, userId);
		const queuedId = deleted.path
			? await deps.deletionQueue.enqueue("images", userId, deleted.path)
			: null;
		return { result: deleted, jobId: queuedId };
	});
	if (jobId) await deps.deletionQueue.process(jobId);
	const { path } = result;

	// Dispatch domain event
	await eventDispatcher.dispatch(
		new ImageDeletedEvent({
			path,
			userId: userId,
			caller: "deleteImage",
		}),
	);
}
