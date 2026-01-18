/**
 * Dependency types and defaults for book creation.
 *
 * @remarks
 * Separated from add-books.ts to avoid "use server" export restrictions.
 * Only async functions can be exported from server action files.
 *
 * @module
 */

import type { IBooksCommandRepository } from "@s-hirano-ist/s-core/books/repositories/books-command-repository.interface";
import type { IStorageService } from "@s-hirano-ist/s-core/common/services/storage-service.interface";
import { booksCommandRepository } from "@/infrastructures/books/repositories/books-command-repository";
import { booksStorageService } from "@/infrastructures/books/services/books-storage-service";
import {
	type createDomainServiceFactory,
	domainServiceFactory,
} from "@/infrastructures/factories/domain-service-factory";

/**
 * Dependencies for the addBooksCore function.
 */
export type AddBooksDeps = {
	commandRepository: IBooksCommandRepository;
	storageService: IStorageService;
	domainServiceFactory: ReturnType<typeof createDomainServiceFactory>;
};

/**
 * Default dependencies for production use.
 */
export const defaultAddBooksDeps: AddBooksDeps = {
	commandRepository: booksCommandRepository,
	storageService: booksStorageService,
	domainServiceFactory: domainServiceFactory,
};
