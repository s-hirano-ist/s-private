/**
 * Dependency types and defaults for image deletion.
 *
 * @remarks
 * Separated from delete-image.ts to avoid "use server" export restrictions.
 * Only async functions can be exported from server action files.
 *
 * @module
 */

import type { IImagesCommandRepository } from "@s-hirano-ist/s-core/images/repositories/images-command-repository.interface";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { imagesCommandRepository } from "@/infrastructures/images/repositories/images-command-repository";
import type { IEventDispatcher } from "../articles/add-article.deps";

/**
 * Dependencies for the deleteImageCore function.
 */
export type DeleteImageDeps = {
	commandRepository: IImagesCommandRepository;
	eventDispatcher: IEventDispatcher;
};

/**
 * Default dependencies for production use.
 */
export const defaultDeleteImageDeps: DeleteImageDeps = {
	commandRepository: imagesCommandRepository,
	eventDispatcher: eventDispatcher,
};
