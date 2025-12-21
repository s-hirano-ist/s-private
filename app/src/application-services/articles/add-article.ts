/**
 * Article creation server action.
 *
 * @remarks
 * Handles article creation with domain validation and cache invalidation.
 *
 * @module
 */

"use server";
import "server-only";
import { articleEntity } from "@s-hirano-ist/s-core/articles/entities/article-entity";
import { ArticlesDomainService } from "@s-hirano-ist/s-core/articles/services/articles-domain-service";
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
import { articlesQueryRepository } from "@/infrastructures/articles/repositories/articles-query-repository";
import { parseAddArticleFormData } from "./helpers/form-data-parser";

/**
 * Server action to create a new article.
 *
 * @remarks
 * Performs the following steps:
 * 1. Permission check (dumper role required)
 * 2. Form data parsing and validation
 * 3. Domain duplicate check
 * 4. Entity creation with value objects
 * 5. Persistence and cache invalidation
 *
 * @param formData - Form data containing title, quote, url, category
 * @returns Server action result with success/failure status
 */
export async function addArticle(formData: FormData): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	const articlesDomainService = new ArticlesDomainService(
		articlesQueryRepository,
	);

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
		await articlesCommandRepository.create(article);

		revalidateTag(buildContentCacheTag("articles", article.status, userId));
		revalidateTag(buildCountCacheTag("articles", article.status, userId));

		revalidateTag("categories");

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
