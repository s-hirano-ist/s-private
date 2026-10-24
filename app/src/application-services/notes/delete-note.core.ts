import "server-only";
import type { DeleteNoteDeps } from "@/application-services/notes/delete-note.deps";
import type { ServerAction } from "@/common/types";
import type {
	UserId,
	Id,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { getSelfId } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { deleteNote } from "@s-hirano-ist/s-backend/notes/use-cases";

/** Web error/session adapter; the domain use case lives in the shared backend. */
export async function deleteNoteCore(
	id: Id,
	deps: DeleteNoteDeps,
	principalId?: UserId,
): Promise<ServerAction> {
	try {
		await deleteNote(id, principalId ?? (await getSelfId()), deps);
		return { success: true, message: "deleted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
