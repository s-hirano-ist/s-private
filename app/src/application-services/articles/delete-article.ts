/**
 * Article deletion server action.
 *
 * @module
 */

"use server";
import "server-only";
import type { ServerAction } from "@/common/types";
import { requireAuth } from "@/common/auth/session";
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
	await requireAuth();

	const id = makeId(rawId);

	return deleteArticleCore(id, defaultDeleteArticleDeps);
}
