import type { MobileDeps } from "@s-hirano-ist/s-backend/mobile/deps";
import type { PushConfig } from "@s-hirano-ist/s-backend/notifications/push-notification-service";
import type { ErrorReporter } from "@s-hirano-ist/s-backend/observability/reporter";
import type { createVectorSearch } from "@s-hirano-ist/s-backend/search/vector-search";
import type { DatabaseClient } from "@s-hirano-ist/s-backend/shared/database";
import type { EventDispatcher } from "@s-hirano-ist/s-backend/shared/ports";
import type { IStorageService } from "@s-hirano-ist/s-core/shared-kernel/services/storage-service.interface";
import { createPushService } from "@s-hirano-ist/s-backend/api/push-service";
import { createReadService } from "@s-hirano-ist/s-backend/api/read-service";
import { createUploadService } from "@s-hirano-ist/s-backend/api/upload-service";
import { createWriteService } from "@s-hirano-ist/s-backend/api/write-service";
import { createCategoryCommandRepository } from "@s-hirano-ist/s-backend/articles/category-command-repository";
import { createArticlesCommandRepository } from "@s-hirano-ist/s-backend/articles/command-repository";
import { createArticlesQueryRepositories } from "@s-hirano-ist/s-backend/articles/query-repository";
import { createBooksCommandRepository } from "@s-hirano-ist/s-backend/books/command-repository";
import { createBooksQueryRepository } from "@s-hirano-ist/s-backend/books/query-repository";
import { createImagesCommandRepository } from "@s-hirano-ist/s-backend/images/command-repository";
import { createImagesQueryRepository } from "@s-hirano-ist/s-backend/images/query-repository";
import { createMobilePersistence } from "@s-hirano-ist/s-backend/mobile/prisma-persistence";
import { createNotesCommandRepository } from "@s-hirano-ist/s-backend/notes/command-repository";
import { createNotesQueryRepository } from "@s-hirano-ist/s-backend/notes/query-repository";
import { createPushSubscriptionRepository } from "@s-hirano-ist/s-backend/notifications/prisma-push-subscription-repository";
import { createPushDeliveryService } from "@s-hirano-ist/s-backend/notifications/push-notification-service";
import { ArticlesDomainService } from "@s-hirano-ist/s-core/articles/services/articles-domain-service";
import { CategoryService } from "@s-hirano-ist/s-core/articles/services/category-service";
import { BooksDomainService } from "@s-hirano-ist/s-core/books/services/books-domain-service";
import { ImagesDomainService } from "@s-hirano-ist/s-core/images/services/images-domain-service";
import { NotesDomainService } from "@s-hirano-ist/s-core/notes/services/notes-domain-service";

export type ApiServicesConfig = {
	chunks: MobileDeps["chunks"];
	database: DatabaseClient;
	eventDispatcher: EventDispatcher;
	push: PushConfig;
	reporter: Pick<ErrorReporter, "captureException">;
	searchVectors: ReturnType<typeof createVectorSearch>;
	storage: { images: IStorageService; books: IStorageService };
};

/** Shared composition: raw repositories and domain services, without Web caches or Next.js. */
export function createApiServices(config: ApiServicesConfig) {
	const { database, storage, eventDispatcher } = config;
	const persistence = createMobilePersistence(database);
	const mobile: MobileDeps = {
		accounts: persistence,
		content: persistence,
		sync: persistence,
		operations: persistence,
		uploads: persistence,
		errors: persistence,
		chunks: config.chunks,
	};
	const { articlesQueryRepository, categoryQueryRepository } =
		createArticlesQueryRepositories(database);
	const categoryCommandRepository = createCategoryCommandRepository(database);
	const notesQueryRepository = createNotesQueryRepository(database);
	const imagesQueryRepository = createImagesQueryRepository(database);
	const booksQueryRepository = createBooksQueryRepository(database);
	const domainServiceFactory = {
		createArticlesDomainService: () =>
			new ArticlesDomainService(articlesQueryRepository),
		createCategoryService: () =>
			new CategoryService(categoryQueryRepository, categoryCommandRepository),
		createNotesDomainService: () =>
			new NotesDomainService(notesQueryRepository),
		createImagesDomainService: () =>
			new ImagesDomainService(imagesQueryRepository),
		createBooksDomainService: () =>
			new BooksDomainService(booksQueryRepository),
	};
	const writes = createWriteService({
		articles: {
			commandRepository: createArticlesCommandRepository(database),
			domainServiceFactory,
			eventDispatcher,
		},
		notes: {
			commandRepository: createNotesCommandRepository(database),
			domainServiceFactory,
			eventDispatcher,
		},
		images: {
			commandRepository: createImagesCommandRepository(database),
			storageService: storage.images,
			domainServiceFactory,
			eventDispatcher,
		},
		books: {
			commandRepository: createBooksCommandRepository(database),
			storageService: storage.books,
			domainServiceFactory,
			eventDispatcher,
		},
		mobile,
	});
	const pushRepository = createPushSubscriptionRepository(database);
	const pushDelivery = createPushDeliveryService(
		config.push,
		pushRepository,
		config.reporter,
	);
	return {
		mobile,
		pushDelivery,
		reads: createReadService({
			database,
			mobile,
			storage,
			searchVectors: config.searchVectors,
		}),
		mutations: {
			writes,
			uploads: createUploadService(mobile, writes),
			push: createPushService(
				pushRepository,
				config.push.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
				pushDelivery.sendPushToSubscription,
			),
		},
	};
}
