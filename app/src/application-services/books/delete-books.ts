/**
 * Book deletion server action.
 *
 * @module
 */

"use server";
import "server-only";
import {
	makeId,
	makeUnexportedStatus,
} from "@s-hirano-ist/s-core/common/entities/common-entity";
import { revalidateTag } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/common/utils/cache-tag-builder";
import { booksCommandRepository } from "@/infrastructures/books/repositories/books-command-repository";

/**
 * Server action to delete a book.
 *
 * @remarks
 * Only unexported books can be deleted. Requires dumper role permission.
 *
 * @param id - Book ID to delete
 * @returns Server action result with success/failure status
 */
export async function deleteBooks(id: string): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		const status = makeUnexportedStatus();
		await booksCommandRepository.deleteById(makeId(id), userId, status);

		revalidateTag(buildContentCacheTag("books", status, userId));
		revalidateTag(buildCountCacheTag("books", status, userId));

		return { success: true, message: "deleted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
