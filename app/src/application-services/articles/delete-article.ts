/**
 * Article deletion server action.
 *
 * @module
 */

"use server";
import "server-only";
import type { ServerAction } from "@/common/types";
import { withSelfTenant } from "@/common/tenant/with-tenant";
import { makeId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { deleteArticleCore } from "./delete-article.core";
import { defaultDeleteArticleDeps } from "./delete-article.deps";

/**
 * Server action to delete an article.
 *
 * @remarks
 * This is the public-facing Server Action that handles authentication and authorization,
 * then delegates to deleteArticleCore for business logic.
 *
 * Only unexported articles can be deleted.
 * Requires dumper role permission.
 *
 * @param rawId - Article ID to delete
 * @returns Server action result with success/failure status
 */
export async function deleteArticle(rawId: string): Promise<ServerAction> {
	return withSelfTenant(() =>
		deleteArticleCore(makeId(rawId), defaultDeleteArticleDeps),
	);
}
