import type { CreateNoteDeps } from "@s-hirano-ist/s-backend/notes/use-cases";
/**
 * Dependency types and defaults for note creation.
 *
 * @remarks
 * Separated from add-note.ts to avoid "use server" export restrictions.
 * Only async functions can be exported from server action files.
 *
 * @module
 */
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { domainServiceFactory } from "@/infrastructures/factories/domain-service-factory";
import { notesCommandRepository } from "@/infrastructures/notes/repositories/notes-command-repository";

/**
 * Dependencies for the addNoteCore function.
 */
export type AddNoteDeps = CreateNoteDeps;

/**
 * Default dependencies for production use.
 */
export const defaultAddNoteDeps: AddNoteDeps = {
	commandRepository: notesCommandRepository,
	domainServiceFactory: domainServiceFactory,
	eventDispatcher: eventDispatcher,
};
