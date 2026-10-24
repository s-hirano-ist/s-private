import type { DeleteNoteDeps as BackendDeleteNoteDeps } from "@s-hirano-ist/s-backend/notes/use-cases";
/**
 * Dependency types and defaults for note deletion.
 *
 * @remarks
 * Separated from delete-note.ts to avoid "use server" export restrictions.
 * Only async functions can be exported from server action files.
 *
 * @module
 */
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { notesCommandRepository } from "@/infrastructures/notes/repositories/notes-command-repository";

/**
 * Dependencies for the deleteNoteCore function.
 */
export type DeleteNoteDeps = BackendDeleteNoteDeps;

/**
 * Default dependencies for production use.
 */
export const defaultDeleteNoteDeps: DeleteNoteDeps = {
	commandRepository: notesCommandRepository,
	eventDispatcher: eventDispatcher,
};
