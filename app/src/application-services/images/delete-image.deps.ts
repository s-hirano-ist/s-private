import type { DeleteImageDeps as BackendDeps } from "@s-hirano-ist/s-backend/images/use-cases";
/**
 * Dependency types and defaults for image deletion.
 *
 * @remarks
 * Separated from delete-image.ts to avoid "use server" export restrictions.
 * Only async functions can be exported from server action files.
 *
 * @module
 */
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { imagesCommandRepository } from "@/infrastructures/images/repositories/images-command-repository";

/**
 * Dependencies for the deleteImageCore function.
 */
export type DeleteImageDeps = BackendDeps;

/**
 * Default dependencies for production use.
 */
export const defaultDeleteImageDeps: DeleteImageDeps = {
	commandRepository: imagesCommandRepository,
	eventDispatcher: eventDispatcher,
};
