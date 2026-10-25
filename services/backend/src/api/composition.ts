import type { IStorageService } from "@s-hirano-ist/s-core/shared-kernel/services/storage-service.interface";
import type { MobileDeps } from "s-private-backend/mobile/deps";
import type { PushConfig } from "s-private-backend/notifications/push-notification-service";
import type { ErrorReporter } from "s-private-backend/observability/reporter";
import type { createVectorSearch } from "s-private-backend/search/vector-search";
import type { DatabaseClient } from "s-private-backend/shared/database";
import type { EventDispatcher } from "s-private-backend/shared/ports";
import { ArticlesDomainService } from "@s-hirano-ist/s-core/articles/services/articles-domain-service";
import { CategoryService } from "@s-hirano-ist/s-core/articles/services/category-service";
import { BooksDomainService } from "@s-hirano-ist/s-core/books/services/books-domain-service";
import { ImagesDomainService } from "@s-hirano-ist/s-core/images/services/images-domain-service";
import { NotesDomainService } from "@s-hirano-ist/s-core/notes/services/notes-domain-service";
import { createPushService } from "s-private-backend/api/push-service";
import { createReadService } from "s-private-backend/api/read-service";
import { createUploadService } from "s-private-backend/api/upload-service";
import { createWriteService } from "s-private-backend/api/write-service";
import { createCategoryCommandRepository } from "s-private-backend/articles/category-command-repository";
import { createArticlesCommandRepository } from "s-private-backend/articles/command-repository";
import { createArticlesQueryRepositories } from "s-private-backend/articles/query-repository";
import { createBooksCommandRepository } from "s-private-backend/books/command-repository";
import { createBooksQueryRepository } from "s-private-backend/books/query-repository";
import { createImagesCommandRepository } from "s-private-backend/images/command-repository";
import { createImagesQueryRepository } from "s-private-backend/images/query-repository";
import { createMobilePersistence } from "s-private-backend/mobile/prisma-persistence";
import { createNotesCommandRepository } from "s-private-backend/notes/command-repository";
import { createNotesQueryRepository } from "s-private-backend/notes/query-repository";
import { createPushSubscriptionRepository } from "s-private-backend/notifications/prisma-push-subscription-repository";
import { createPushDeliveryService } from "s-private-backend/notifications/push-notification-service";

export type ApiServicesConfig = {
	chunks: MobileDeps["chunks"];
	database: DatabaseClient;
	eventDispatcher: EventDispatcher;
	push: PushConfig;
	reporter: Pick<ErrorReporter, "captureException">;
	searchVectors: ReturnType<typeof createVectorSearch>;
	storage: { books: IStorageService; images: IStorageService; };
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
