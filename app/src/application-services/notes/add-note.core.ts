import "server-only";
import type { AddNoteDeps } from "@/application-services/notes/add-note.deps";
import type { ServerActionWithData } from "@/common/types";
import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { parseAddNoteFormData } from "@/application-services/notes/helpers/form-data-parser";
import { getSelfId } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { createNote } from "@s-hirano-ist/s-backend/notes/use-cases";

/** Web error/session adapter; the domain use case lives in the shared backend. */
export async function addNoteCore(
	formData: FormData,
	deps: AddNoteDeps,
	principalId?: UserId,
): Promise<ServerActionWithData<{ id: string }>> {
	try {
		const data = parseAddNoteFormData(
			formData,
			principalId ?? (await getSelfId()),
		);
		const result = await createNote(data, deps);
		return { success: true, message: "inserted", data: result };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
