import "server-only";
import type { DeleteBooksDeps } from "@/application-services/books/delete-books.deps";
import type { ServerAction } from "@/common/types";
import type {
	Id,
	UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { getSelfId } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { deleteBook } from "@s-hirano-ist/s-backend/books/use-cases";
export async function deleteBooksCore(
	id: Id,
	deps: DeleteBooksDeps,
	principalId?: UserId,
): Promise<ServerAction> {
	try {
		await deleteBook(id, principalId ?? (await getSelfId()), deps);
		return { success: true, message: "deleted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
