/**
 * Article deletion server action.
 *
 * @remarks
 * Handles article deletion with permission check and cache invalidation.
 *
 * @module
 */

"use server";
import "server-only";
import {
	makeId,
	makeUnexportedStatus,
} from "@s-hirano-ist/s-core/common/entities/common-entity";
import { revalidateTag } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/common/utils/cache-tag-builder";
import { articlesCommandRepository } from "@/infrastructures/articles/repositories/articles-command-repository";

/**
 * Server action to delete an article.
 *
 * @remarks
 * Only unexported articles can be deleted.
 * Requires dumper role permission.
 *
 * @param id - Article ID to delete
 * @returns Server action result with success/failure status
 */
export async function deleteArticle(id: string): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		const status = makeUnexportedStatus();
		await articlesCommandRepository.deleteById(makeId(id), userId, status);

		revalidateTag(buildContentCacheTag("articles", status, userId));
		revalidateTag(buildCountCacheTag("articles", status, userId));

		return { success: true, message: "deleted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
