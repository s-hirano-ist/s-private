/**
 * Note deletion server action.
 *
 * @module
 */

"use server";
import "server-only";
import type { ServerAction } from "@/common/types";
import { withSelfTenant } from "@/common/tenant/with-tenant";
import { makeId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
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
 * @param rawId - Note ID to delete
 * @returns Server action result with success/failure status
 */
export async function deleteNote(rawId: string): Promise<ServerAction> {
	return withSelfTenant(() =>
		deleteNoteCore(makeId(rawId), defaultDeleteNoteDeps),
	);
}
