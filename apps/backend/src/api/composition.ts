import type { EventDispatcher } from "@s-hirano-ist/s-application/events/ports";
import type { MobileDeps } from "@s-hirano-ist/s-application/mobile/deps";
import type { IStorageService } from "@s-hirano-ist/s-core/shared-kernel/services/storage-service.interface";
import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
import type { createVectorSearch } from "@s-hirano-ist/s-infrastructure/search/vector-search";
import type { PushConfig } from "s-private-backend/notifications/push-notification-service";
import type { ErrorReporter } from "s-private-backend/observability/reporter";
import { createReadQueries } from "@s-hirano-ist/s-application/content/queries";
import { ArticlesDomainService } from "@s-hirano-ist/s-core/articles/services/articles-domain-service";
import { CategoryService } from "@s-hirano-ist/s-core/articles/services/category-service";
import { BooksDomainService } from "@s-hirano-ist/s-core/books/services/books-domain-service";
import { ImagesDomainService } from "@s-hirano-ist/s-core/images/services/images-domain-service";
import { NotesDomainService } from "@s-hirano-ist/s-core/notes/services/notes-domain-service";
import { createCategoryCommandRepository } from "@s-hirano-ist/s-infrastructure/articles/category-command-repository";
import { createArticlesCommandRepository } from "@s-hirano-ist/s-infrastructure/articles/command-repository";
import { createArticlesQueryRepositories } from "@s-hirano-ist/s-infrastructure/articles/query-repository";
import { createBooksCommandRepository } from "@s-hirano-ist/s-infrastructure/books/command-repository";
import { createBooksQueryRepository } from "@s-hirano-ist/s-infrastructure/books/query-repository";
import { createMediaReader } from "@s-hirano-ist/s-infrastructure/content/media-reader";
import { createContentQueryRepository } from "@s-hirano-ist/s-infrastructure/content/query-repository";
import { createImagesCommandRepository } from "@s-hirano-ist/s-infrastructure/images/command-repository";
import { createImagesQueryRepository } from "@s-hirano-ist/s-infrastructure/images/query-repository";
import { createMobilePersistence } from "@s-hirano-ist/s-infrastructure/mobile/prisma-persistence";
import { createNotesCommandRepository } from "@s-hirano-ist/s-infrastructure/notes/command-repository";
import { createNotesQueryRepository } from "@s-hirano-ist/s-infrastructure/notes/query-repository";
import { createPushSubscriptionRepository } from "@s-hirano-ist/s-infrastructure/notifications/prisma-push-subscription-repository";
import { createSearchIndex } from "@s-hirano-ist/s-infrastructure/search/search-index";
import { createPushService } from "s-private-backend/api/push-service";
import { createReadService } from "s-private-backend/api/read-service";
import { createUploadService } from "s-private-backend/api/upload-service";
import { createWriteService } from "s-private-backend/api/write-service";
import { createPushDeliveryService } from "s-private-backend/notifications/push-notification-service";

export type ApiServicesConfig = {
	chunks: MobileDeps["chunks"];
	database: DatabaseClient;
	eventDispatcher: EventDispatcher;
	push: PushConfig;
	reporter: Pick<ErrorReporter, "captureException">;
	searchVectors: ReturnType<typeof createVectorSearch>;
	storage: { books: IStorageService; images: IStorageService };
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
		reads: createReadService(
			createReadQueries({
				content: mobile.content,
				sync: mobile.sync,
				query: createContentQueryRepository(database),
				search: createSearchIndex(config.searchVectors),
				media: {
					images: createMediaReader(storage.images),
					books: createMediaReader(storage.books),
				},
			}),
		),
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
