import type { BookCreationInput } from "@s-hirano-ist/s-application/books/input-model";
import type {
	MediaLock,
	MediaDeletionDeps,
} from "@s-hirano-ist/s-application/content/media-lifecycle";
import type { IStorageService } from "@s-hirano-ist/s-application/content/storage-port";
import type { EventDispatcher } from "@s-hirano-ist/s-application/events/ports";
import type { IBooksCommandRepository } from "@s-hirano-ist/s-core/books/repositories/books-command-repository.interface";
import type { BooksDomainService } from "@s-hirano-ist/s-core/books/services/books-domain-service";
import {
	withOperationPhase,
	type OperationPhaseContext,
} from "@s-hirano-ist/s-application/diagnostics/operation-phase-error";
import { withStoragePhase } from "@s-hirano-ist/s-application/diagnostics/storage-phase-error";
import {
	directCommit,
	type MutationCommit,
} from "@s-hirano-ist/s-application/transaction";
import { bookEntity } from "@s-hirano-ist/s-core/books/entities/book-entity";
import { BookDeletedEvent } from "@s-hirano-ist/s-core/books/events/book-deleted-event";
import {
	type Id,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
export type DeleteBookDeps = MediaDeletionDeps & {
	commandRepository: IBooksCommandRepository;
	eventDispatcher: EventDispatcher;
};
export type CreateBookDeps = DeleteBookDeps & {
	domainServiceFactory: {
		createBooksDomainService(): Pick<BooksDomainService, "ensureNoDuplicate">;
	};
	mediaLock: MediaLock;
	storageService: IStorageService;
};
export async function createBook(
	parsedData: BookCreationInput,
	deps: CreateBookDeps,
	phaseContext: Omit<OperationPhaseContext, "phase">,
	commit: MutationCommit = directCommit,
) {
	return deps.mediaLock.run("books", parsedData.path, async (assertActive) => {
		const {
			commandRepository,
			storageService,
			domainServiceFactory,
			eventDispatcher,
		} = deps;
		const booksDomainService = domainServiceFactory.createBooksDomainService();

		// Domain business rule validation
		await withOperationPhase(
			{ ...phaseContext, phase: "validate-domain" },
			() =>
				booksDomainService.ensureNoDuplicate(
					parsedData.isbn,
					parsedData.userId,
				),
		);

		const storageContext = {
			action: "addBooks",
			path: parsedData.path,
			fileSize: parsedData.fileSize,
			contentType: parsedData.contentType,
			isbn: parsedData.isbn,
		};

		// Upload image to MinIO (original + thumbnail)
		await assertActive();
		await withStoragePhase(
			{
				phase: "upload-original",
				path: parsedData.path,
				isThumbnail: false,
				additionalContext: storageContext,
			},
			() =>
				storageService.uploadImage(
					parsedData.path,
					parsedData.originalBuffer,
					false,
				),
		);
		await assertActive();
		await withStoragePhase(
			{
				phase: "upload-thumbnail",
				path: parsedData.path,
				isThumbnail: true,
				additionalContext: storageContext,
			},
			() =>
				storageService.uploadImage(
					parsedData.path,
					parsedData.thumbnailBuffer,
					true,
				),
		);

		// Create entity with value objects and domain event
		const [book, event] = await withOperationPhase(
			{ ...phaseContext, phase: "create-entity" },
			async () =>
				bookEntity.create({
					isbn: parsedData.isbn,
					title: parsedData.title,
					rating: parsedData.rating,
					tags: parsedData.tags,
					userId: parsedData.userId,
					imagePath: parsedData.imagePath,
					caller: "addBooks",
				}),
		);

		// Persist (cache invalidation is handled in repository)
		await assertActive();
		await commit(async () => {
			await withOperationPhase(
				{ ...phaseContext, phase: "create-record" },
				() => commandRepository.create(book),
			);
			return book.id;
		});

		// Dispatch domain event
		await withOperationPhase({ ...phaseContext, phase: "dispatch-event" }, () =>
			eventDispatcher.dispatch(event),
		);

		return { id: book.id };
	});
}

export async function deleteBook(
	id: Id,
	userId: UserId,
	deps: DeleteBookDeps,
): Promise<void> {
	const { commandRepository, eventDispatcher } = deps;
	// Cache invalidation is handled in repository
	const { result, jobId } = await deps.transactions.run(async () => {
		const deleted = await commandRepository.deleteById(id, userId);
		const queuedId = deleted.imagePath
			? await deps.deletionQueue.enqueue("books", userId, deleted.imagePath)
			: null;
		return { result: deleted, jobId: queuedId };
	});
	if (jobId) await deps.deletionQueue.process(jobId);
	const { title } = result;

	// Dispatch domain event
	await eventDispatcher.dispatch(
		new BookDeletedEvent({
			title,
			userId: userId,
			caller: "deleteBooks",
		}),
	);
}
