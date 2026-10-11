import type { DeleteBookDeps as BackendDeps } from "@s-hirano-ist/s-backend/books/use-cases";
/**
 * Dependency types and defaults for book deletion.
 *
 * @remarks
 * Separated from delete-books.ts to avoid "use server" export restrictions.
 * Only async functions can be exported from server action files.
 *
 * @module
 */
import { booksCommandRepository } from "@/infrastructures/books/repositories/books-command-repository";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";

/**
 * Dependencies for the deleteBooksCore function.
 */
export type DeleteBooksDeps = BackendDeps;

/**
 * Default dependencies for production use.
 */
export const defaultDeleteBooksDeps: DeleteBooksDeps = {
	commandRepository: booksCommandRepository,
	eventDispatcher: eventDispatcher,
};
