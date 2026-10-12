import "server-only";
import type { DeleteArticleDeps } from "@/application-services/articles/delete-article.deps";
import type { ServerAction } from "@/common/types";
import { getSelfId } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { deleteArticle } from "@s-hirano-ist/s-backend/articles/use-cases";
import {
	makeUserId,
	type UserId,
	type Id,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";

/** Web error/session adapter; the domain use case lives in the shared backend. */
export async function deleteArticleCore(
	id: Id,
	deps: DeleteArticleDeps,
	principalId?: UserId,
): Promise<ServerAction> {
	try {
		await deleteArticle(id, principalId ?? makeUserId(await getSelfId()), deps);
		return { success: true, message: "deleted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
