/**
 * Note deletion server action.
 *
 * @module
 */

"use server";
import "server-only";
import { makeId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { forbidden } from "next/navigation";
import { hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import { deleteNoteCore } from "./delete-note.core";
import { defaultDeleteNoteDeps } from "./delete-note.deps";

/**
 * Server action to delete a note.
 *
 * @remarks
 * This is the public-facing Server Action that handles authentication and authorization,
 * then delegates to deleteNoteCore for business logic.
 *
 * Only unexported notes can be deleted. Requires dumper role permission.
 *
 * @param rawId - Note ID to delete (validated at this layer)
 * @returns Server action result with success/failure status
 */
export async function deleteNote(rawId: string): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const id = makeId(rawId);
		return deleteNoteCore(id, defaultDeleteNoteDeps);
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
