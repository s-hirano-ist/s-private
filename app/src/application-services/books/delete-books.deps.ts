/**
 * Dependency types and defaults for book deletion.
 *
 * @remarks
 * Separated from delete-books.ts to avoid "use server" export restrictions.
 * Only async functions can be exported from server action files.
 *
 * @module
 */

import type { IBooksCommandRepository } from "@s-hirano-ist/s-core/books/repositories/books-command-repository.interface";
import { booksCommandRepository } from "@/infrastructures/books/repositories/books-command-repository";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import type { IEventDispatcher } from "../common/event-dispatcher.interface";

/**
 * Dependencies for the deleteBooksCore function.
 */
export type DeleteBooksDeps = {
	commandRepository: IBooksCommandRepository;
	eventDispatcher: IEventDispatcher;
};

/**
 * Default dependencies for production use.
 */
export const defaultDeleteBooksDeps: DeleteBooksDeps = {
	commandRepository: booksCommandRepository,
	eventDispatcher: eventDispatcher,
};
