/**
 * Book creation server action.
 *
 * @module
 */

"use server";
import "server-only";
import type { ServerAction } from "@/common/types";
import { requireAuth } from "@/common/auth/session";
import { addBooksCore } from "./add-books.core";
import { defaultAddBooksDeps } from "./add-books.deps";

/**
 * Server action to create a new book record.
 *
 * @remarks
 * This is the public-facing Server Action that handles authentication and authorization,
 * then delegates to addBooksCore for business logic.
 *
 * Validates ISBN uniqueness and creates book with Google Books metadata.
 * Requires dumper role permission.
 *
 * @param formData - Form data containing ISBN and title
 * @returns Server action result with success/failure status
 */
export async function addBooks(formData: FormData): Promise<ServerAction> {
	await requireAuth();

	return addBooksCore(formData, defaultAddBooksDeps);
}
