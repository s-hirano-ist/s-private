/**
 * Core business logic for article creation.
 *
 * @remarks
 * NOT a Server Action - for internal use and testing only.
 *
 * @module
 */

import "server-only";
import { articleEntity } from "@s-hirano-ist/s-core/articles/entities/article-entity";
import { getSelfId } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import type { AddArticleDeps } from "./add-article.deps";
import { parseAddArticleFormData } from "./helpers/form-data-parser";

/**
 * Core business logic for creating an article.
 *
 * @remarks
 * This function contains the pure business logic without authentication/authorization.
 * It is designed to be easily testable by accepting dependencies as parameters.
 *
 * Performs the following steps:
 * 1. Form data parsing and validation
 * 2. Domain duplicate check
 * 3. Entity creation with value objects and domain event
 * 4. Persistence, event dispatch, and cache invalidation
 *
 * @param formData - Form data containing title, quote, url, category
 * @param deps - Dependencies (repository, domain service factory, event dispatcher)
 * @returns Server action result with success/failure status
 */
export async function addArticleCore(
	formData: FormData,
	deps: AddArticleDeps,
): Promise<ServerAction> {
	const { commandRepository, domainServiceFactory, eventDispatcher } = deps;
	const articlesDomainService =
		domainServiceFactory.createArticlesDomainService();

	try {
		const { title, quote, url, categoryName, userId } = parseAddArticleFormData(
			formData,
			await getSelfId(),
		);

		// Domain business rule validation
		await articlesDomainService.ensureNoDuplicate(url, userId);

		// Create entity with value objects and domain event
		const [article, event] = articleEntity.create({
			title,
			quote,
			url,
			categoryName,
			userId,
			caller: "addArticle",
		});

		// Persist (cache invalidation is handled in repository)
		await commandRepository.create(article);

		// Dispatch domain event
		await eventDispatcher.dispatch(event);

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
