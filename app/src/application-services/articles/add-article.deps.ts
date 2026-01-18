/**
 * Dependency types and defaults for article creation.
 *
 * @remarks
 * Separated from add-article.ts to avoid "use server" export restrictions.
 * Only async functions can be exported from server action files.
 *
 * @module
 */

import type { IArticlesCommandRepository } from "@s-hirano-ist/s-core/articles/repositories/articles-command-repository.interface";
import type { DomainEvent } from "@s-hirano-ist/s-core/common/events/domain-event.interface";
import { articlesCommandRepository } from "@/infrastructures/articles/repositories/articles-command-repository";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import {
	type createDomainServiceFactory,
	domainServiceFactory,
} from "@/infrastructures/factories/domain-service-factory";

/**
 * Event dispatcher interface for dependency injection.
 */
export type IEventDispatcher = {
	dispatch(event: DomainEvent): Promise<void>;
};

/**
 * Dependencies for the addArticleCore function.
 */
export type AddArticleDeps = {
	commandRepository: IArticlesCommandRepository;
	domainServiceFactory: ReturnType<typeof createDomainServiceFactory>;
	eventDispatcher: IEventDispatcher;
};

/**
 * Default dependencies for production use.
 */
export const defaultAddArticleDeps: AddArticleDeps = {
	commandRepository: articlesCommandRepository,
	domainServiceFactory: domainServiceFactory,
	eventDispatcher: eventDispatcher,
};
