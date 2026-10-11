import type { CreateArticleDeps } from "@s-hirano-ist/s-backend/articles/use-cases";
/**
 * Dependency types and defaults for article creation.
 *
 * @remarks
 * Separated from add-article.ts to avoid "use server" export restrictions.
 * Only async functions can be exported from server action files.
 *
 * @module
 */
import { articlesCommandRepository } from "@/infrastructures/articles/repositories/articles-command-repository";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { domainServiceFactory } from "@/infrastructures/factories/domain-service-factory";

/**
 * Dependencies for the addArticleCore function.
 */
export type AddArticleDeps = CreateArticleDeps;

/**
 * Default dependencies for production use.
 */
export const defaultAddArticleDeps: AddArticleDeps = {
	commandRepository: articlesCommandRepository,
	domainServiceFactory: domainServiceFactory,
	eventDispatcher: eventDispatcher,
};
