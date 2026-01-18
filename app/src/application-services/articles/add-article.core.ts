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
import { revalidateTag } from "next/cache";
import { getSelfId } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/common/utils/cache-tag-builder";
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
 * 3. Entity creation with value objects
 * 4. Persistence and cache invalidation
 *
 * @param formData - Form data containing title, quote, url, category
 * @param deps - Dependencies (repository, domain service factory)
 * @returns Server action result with success/failure status
 */
export async function addArticleCore(
	formData: FormData,
	deps: AddArticleDeps,
): Promise<ServerAction> {
	const { commandRepository, domainServiceFactory } = deps;
	const articlesDomainService =
		domainServiceFactory.createArticlesDomainService();

	try {
		const { title, quote, url, categoryName, userId } = parseAddArticleFormData(
			formData,
			await getSelfId(),
		);

		// Domain business rule validation
		await articlesDomainService.ensureNoDuplicate(url, userId);

		// Create entity with value objects
		const article = articleEntity.create({
			title,
			quote,
			url,
			categoryName,
			userId,
		});

		// Persist
		await commandRepository.create(article);

		revalidateTag(buildContentCacheTag("articles", article.status, userId));
		revalidateTag(buildCountCacheTag("articles", article.status, userId));

		revalidateTag("categories");

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
