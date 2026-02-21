/**
 * Book deletion server action.
 *
 * @module
 */

"use server";
import "server-only";
import { forbidden } from "next/navigation";
import { makeId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { hasDumperPostPermission } from "@/common/auth/session";
import type { ServerAction } from "@/common/types";
import { deleteBooksCore } from "./delete-books.core";
import { defaultDeleteBooksDeps } from "./delete-books.deps";

/**
 * Server action to delete a book.
 *
 * @remarks
 * This is the public-facing Server Action that handles authentication and authorization,
 * then delegates to deleteBooksCore for business logic.
 *
 * Only unexported books can be deleted. Requires dumper role permission.
 *
 * @param rawId - Book ID to delete
 * @returns Server action result with success/failure status
 */
export async function deleteBooks(rawId: string): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	const id = makeId(rawId);

	return deleteBooksCore(id, defaultDeleteBooksDeps);
}
