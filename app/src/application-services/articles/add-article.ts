/**
 * Article creation server action.
 *
 * @module
 */

"use server";
import "server-only";
import type { ServerAction } from "@/common/types";
import { withSelfTenant } from "@/common/tenant/with-tenant";
import { addArticleCore } from "./add-article.core";
import { defaultAddArticleDeps } from "./add-article.deps";

/**
 * Server action to create a new article.
 *
 * @remarks
 * This is the public-facing Server Action that handles authentication and authorization,
 * then delegates to addArticleCore for business logic.
 *
 * @param formData - Form data containing title, quote, url, category
 * @returns Server action result with success/failure status
 */
export async function addArticle(formData: FormData): Promise<ServerAction> {
	return withSelfTenant(() => addArticleCore(formData, defaultAddArticleDeps));
}
