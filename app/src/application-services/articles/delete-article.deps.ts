/**
 * Dependency types and defaults for article deletion.
 *
 * @remarks
 * Separated from delete-article.ts to avoid "use server" export restrictions.
 * Only async functions can be exported from server action files.
 *
 * @module
 */

import type { IArticlesCommandRepository } from "@s-hirano-ist/s-core/articles/repositories/articles-command-repository.interface";
import { articlesCommandRepository } from "@/infrastructures/articles/repositories/articles-command-repository";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import type { IEventDispatcher } from "../common/event-dispatcher.interface";

/**
 * Dependencies for the deleteArticleCore function.
 */
export type DeleteArticleDeps = {
	commandRepository: IArticlesCommandRepository;
	eventDispatcher: IEventDispatcher;
};

/**
 * Default dependencies for production use.
 */
export const defaultDeleteArticleDeps: DeleteArticleDeps = {
	commandRepository: articlesCommandRepository,
	eventDispatcher: eventDispatcher,
};
