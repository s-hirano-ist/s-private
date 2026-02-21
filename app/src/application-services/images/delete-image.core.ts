/**
 * Core business logic for image deletion.
 *
 * @remarks
 * NOT a Server Action - for internal use and testing only.
 *
 * @module
 */

import "server-only";
import { ImageDeletedEvent } from "@s-hirano-ist/s-core/images/events/image-deleted-event";
import {
	type Id,
	makeUnexportedStatus,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { getSelfId } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import type { DeleteImageDeps } from "./delete-image.deps";

/**
 * Core business logic for deleting an image.
 *
 * @remarks
 * This function contains the pure business logic without authentication/authorization.
 * It is designed to be easily testable by accepting dependencies as parameters.
 *
 * Only unexported images can be deleted.
 *
 * @param id - Validated Image ID to delete
 * @param deps - Dependencies (repository)
 * @returns Server action result with success/failure status
 */
export async function deleteImageCore(
	id: Id,
	deps: DeleteImageDeps,
): Promise<ServerAction> {
	const { commandRepository, eventDispatcher } = deps;

	try {
		const userId = await getSelfId();

		const status = makeUnexportedStatus();
		// Cache invalidation is handled in repository
		const { path } = await commandRepository.deleteById(
			id,
			userId,
			status,
		);

		// Dispatch domain event
		await eventDispatcher.dispatch(
			new ImageDeletedEvent({
				path,
				userId: userId as string,
				caller: "deleteImage",
			}),
		);

		return { success: true, message: "deleted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
