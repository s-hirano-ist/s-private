import type { parseBookInput } from "@s-hirano-ist/s-backend/books/input";
import type { EventDispatcher } from "@s-hirano-ist/s-backend/shared/ports";
import type { IBooksCommandRepository } from "@s-hirano-ist/s-core/books/repositories/books-command-repository.interface";
import type { BooksDomainService } from "@s-hirano-ist/s-core/books/services/books-domain-service";
import type { IStorageService } from "@s-hirano-ist/s-core/shared-kernel/services/storage-service.interface";
import {
	withOperationPhase,
	type OperationPhaseContext,
} from "@s-hirano-ist/s-backend/shared/operation-phase-error";
import { withStoragePhase } from "@s-hirano-ist/s-backend/shared/storage-phase-error";
import { bookEntity } from "@s-hirano-ist/s-core/books/entities/book-entity";
import { BookDeletedEvent } from "@s-hirano-ist/s-core/books/events/book-deleted-event";
import {
	makeUnexportedStatus,
	type Id,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
export type DeleteBookDeps = {
	commandRepository: IBooksCommandRepository;
	eventDispatcher: EventDispatcher;
};
export type CreateBookDeps = DeleteBookDeps & {
	domainServiceFactory: {
		createBooksDomainService(): Pick<BooksDomainService, "ensureNoDuplicate">;
	};
	storageService: IStorageService;
};
export async function createBook(
	parsedData: Awaited<ReturnType<typeof parseBookInput>>,
	deps: CreateBookDeps,
	phaseContext: Omit<OperationPhaseContext, "phase">,
) {
	const {
		commandRepository,
		storageService,
		domainServiceFactory,
		eventDispatcher,
	} = deps;
	const booksDomainService = domainServiceFactory.createBooksDomainService();

	// Domain business rule validation
	await withOperationPhase({ ...phaseContext, phase: "validate-domain" }, () =>
		booksDomainService.ensureNoDuplicate(parsedData.isbn, parsedData.userId),
	);

	const storageContext = {
		action: "addBooks",
		path: parsedData.path,
		fileSize: parsedData.fileSize,
		contentType: parsedData.contentType,
		isbn: parsedData.isbn,
	};

	// Upload image to MinIO (original + thumbnail)
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
	await withOperationPhase({ ...phaseContext, phase: "create-record" }, () =>
		commandRepository.create(book),
	);

	// Dispatch domain event
	await withOperationPhase({ ...phaseContext, phase: "dispatch-event" }, () =>
		eventDispatcher.dispatch(event),
	);

	return { id: book.id };
}
export async function deleteBook(
	id: Id,
	userId: UserId,
	deps: DeleteBookDeps,
): Promise<void> {
	const { commandRepository, eventDispatcher } = deps;
	const status = makeUnexportedStatus();
	// Cache invalidation is handled in repository
	const { title } = await commandRepository.deleteById(id, userId, status);

	// Dispatch domain event
	await eventDispatcher.dispatch(
		new BookDeletedEvent({
			title,
			userId: userId,
			caller: "deleteBooks",
		}),
	);
}
