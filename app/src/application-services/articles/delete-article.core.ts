/**
 * Core business logic for article deletion.
 *
 * @remarks
 * NOT a Server Action - for internal use and testing only.
 *
 * @module
 */

import "server-only";
import { ArticleDeletedEvent } from "@s-hirano-ist/s-core/articles/events/article-deleted-event";
import {
	makeId,
	makeUnexportedStatus,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { getSelfId } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import type { DeleteArticleDeps } from "./delete-article.deps";

/**
 * Core business logic for deleting an article.
 *
 * @remarks
 * This function contains the pure business logic without authentication/authorization.
 * It is designed to be easily testable by accepting dependencies as parameters.
 *
 * Only unexported articles can be deleted.
 *
 * @param id - Article ID to delete
 * @param deps - Dependencies (repository, event dispatcher)
 * @returns Server action result with success/failure status
 */
export async function deleteArticleCore(
	id: string,
	deps: DeleteArticleDeps,
): Promise<ServerAction> {
	const { commandRepository, eventDispatcher } = deps;

	try {
		const userId = await getSelfId();

		const status = makeUnexportedStatus();
		// Cache invalidation is handled in repository
		const { title } = await commandRepository.deleteById(
			makeId(id),
			userId,
			status,
		);

		// Dispatch domain event
		await eventDispatcher.dispatch(
			new ArticleDeletedEvent({
				title,
				userId: userId as string,
				caller: "deleteArticle",
			}),
		);

		return { success: true, message: "deleted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
