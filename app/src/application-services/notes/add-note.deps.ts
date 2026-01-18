/**
 * Dependency types and defaults for note creation.
 *
 * @remarks
 * Separated from add-note.ts to avoid "use server" export restrictions.
 * Only async functions can be exported from server action files.
 *
 * @module
 */

import type { INotesCommandRepository } from "@s-hirano-ist/s-core/notes/repositories/notes-command-repository.interface";
import {
	type createDomainServiceFactory,
	domainServiceFactory,
} from "@/infrastructures/factories/domain-service-factory";
import { notesCommandRepository } from "@/infrastructures/notes/repositories/notes-command-repository";

/**
 * Dependencies for the addNoteCore function.
 */
export type AddNoteDeps = {
	commandRepository: INotesCommandRepository;
	domainServiceFactory: ReturnType<typeof createDomainServiceFactory>;
};

/**
 * Default dependencies for production use.
 */
export const defaultAddNoteDeps: AddNoteDeps = {
	commandRepository: notesCommandRepository,
	domainServiceFactory: domainServiceFactory,
};
