/**
 * Article deletion server action.
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
 * @param rawId - Article ID to delete (validated at this layer)
 * @returns Server action result with success/failure status
 */
export async function deleteArticle(rawId: string): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const id = makeId(rawId);
		return deleteArticleCore(id, defaultDeleteArticleDeps);
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
