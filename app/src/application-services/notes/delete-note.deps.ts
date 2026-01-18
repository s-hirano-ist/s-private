/**
 * Dependency types and defaults for note deletion.
 *
 * @remarks
 * Separated from delete-note.ts to avoid "use server" export restrictions.
 * Only async functions can be exported from server action files.
 *
 * @module
 */

import type { INotesCommandRepository } from "@s-hirano-ist/s-core/notes/repositories/notes-command-repository.interface";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { notesCommandRepository } from "@/infrastructures/notes/repositories/notes-command-repository";
import type { IEventDispatcher } from "../articles/add-article.deps";

/**
 * Dependencies for the deleteNoteCore function.
 */
export type DeleteNoteDeps = {
	commandRepository: INotesCommandRepository;
	eventDispatcher: IEventDispatcher;
};

/**
 * Default dependencies for production use.
 */
export const defaultDeleteNoteDeps: DeleteNoteDeps = {
	commandRepository: notesCommandRepository,
	eventDispatcher: eventDispatcher,
};
