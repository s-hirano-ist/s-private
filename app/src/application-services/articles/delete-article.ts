/**
 * Article deletion server action.
 *
 * @module
 */

"use server";
import "server-only";
import { forbidden } from "next/navigation";
import { hasDumperPostPermission } from "@/common/auth/session";
import type { ServerAction } from "@/common/types";
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
 * @param id - Article ID to delete
 * @returns Server action result with success/failure status
 */
export async function deleteArticle(id: string): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	return deleteArticleCore(id, defaultDeleteArticleDeps);
}
