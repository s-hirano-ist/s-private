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
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import {
	type createDomainServiceFactory,
	domainServiceFactory,
} from "@/infrastructures/factories/domain-service-factory";
import { notesCommandRepository } from "@/infrastructures/notes/repositories/notes-command-repository";
import type { IEventDispatcher } from "../articles/add-article.deps";

/**
 * Dependencies for the addNoteCore function.
 */
export type AddNoteDeps = {
	commandRepository: INotesCommandRepository;
	domainServiceFactory: ReturnType<typeof createDomainServiceFactory>;
	eventDispatcher: IEventDispatcher;
};

/**
 * Default dependencies for production use.
 */
export const defaultAddNoteDeps: AddNoteDeps = {
	commandRepository: notesCommandRepository,
	domainServiceFactory: domainServiceFactory,
	eventDispatcher: eventDispatcher,
};
