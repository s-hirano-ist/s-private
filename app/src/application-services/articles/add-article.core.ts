import "server-only";
import type { AddArticleDeps } from "@/application-services/articles/add-article.deps";
import type { ServerActionWithData } from "@/common/types";
import { parseAddArticleFormData } from "@/application-services/articles/helpers/form-data-parser";
import { getSelfId } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { createArticle } from "@s-hirano-ist/s-backend/articles/use-cases";
import {
	makeUserId,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";

/** Web error/session adapter; the domain use case lives in the shared backend. */
export async function addArticleCore(
	formData: FormData,
	deps: AddArticleDeps,
	principalId?: UserId,
): Promise<ServerActionWithData<{ id: string }>> {
	try {
		const data = parseAddArticleFormData(
			formData,
			principalId ?? makeUserId(await getSelfId()),
		);
		const result = await createArticle(data, deps);
		return { success: true, message: "inserted", data: result };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
