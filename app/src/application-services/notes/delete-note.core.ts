/**
 * Core business logic for note deletion.
 *
 * @remarks
 * NOT a Server Action - for internal use and testing only.
 *
 * @module
 */

import "server-only";
import {
	makeId,
	makeUnexportedStatus,
} from "@s-hirano-ist/s-core/common/entities/common-entity";
import { revalidateTag } from "next/cache";
import { getSelfId } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/common/utils/cache-tag-builder";
import type { DeleteNoteDeps } from "./delete-note.deps";

/**
 * Core business logic for deleting a note.
 *
 * @remarks
 * This function contains the pure business logic without authentication/authorization.
 * It is designed to be easily testable by accepting dependencies as parameters.
 *
 * Only unexported notes can be deleted.
 *
 * @param id - Note ID to delete
 * @param deps - Dependencies (repository)
 * @returns Server action result with success/failure status
 */
export async function deleteNoteCore(
	id: string,
	deps: DeleteNoteDeps,
): Promise<ServerAction> {
	const { commandRepository } = deps;

	try {
		const userId = await getSelfId();

		const status = makeUnexportedStatus();
		await commandRepository.deleteById(makeId(id), userId, status);

		revalidateTag(buildContentCacheTag("notes", status, userId));
		revalidateTag(buildCountCacheTag("notes", status, userId));

		return { success: true, message: "deleted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
