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
import { imagesCommandRepository } from "@/infrastructures/images/repositories/images-command-repository";

/**
 * Dependencies for the deleteImageCore function.
 */
export type DeleteImageDeps = {
	commandRepository: IImagesCommandRepository;
};

/**
 * Default dependencies for production use.
 */
export const defaultDeleteImageDeps: DeleteImageDeps = {
	commandRepository: imagesCommandRepository,
};
