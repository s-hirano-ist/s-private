import type { DeleteArticleDeps as BackendDeleteArticleDeps } from "@s-hirano-ist/s-backend/articles/use-cases";
/**
 * Dependency types and defaults for article deletion.
 *
 * @remarks
 * Separated from delete-article.ts to avoid "use server" export restrictions.
 * Only async functions can be exported from server action files.
 *
 * @module
 */
import { articlesCommandRepository } from "@/infrastructures/articles/repositories/articles-command-repository";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";

/**
 * Dependencies for the deleteArticleCore function.
 */
export type DeleteArticleDeps = BackendDeleteArticleDeps;

/**
 * Default dependencies for production use.
 */
export const defaultDeleteArticleDeps: DeleteArticleDeps = {
	commandRepository: articlesCommandRepository,
	eventDispatcher: eventDispatcher,
};
