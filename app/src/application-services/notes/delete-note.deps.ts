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
import { notesCommandRepository } from "@/infrastructures/notes/repositories/notes-command-repository";

/**
 * Dependencies for the deleteNoteCore function.
 */
export type DeleteNoteDeps = {
	commandRepository: INotesCommandRepository;
};

/**
 * Default dependencies for production use.
 */
export const defaultDeleteNoteDeps: DeleteNoteDeps = {
	commandRepository: notesCommandRepository,
};
