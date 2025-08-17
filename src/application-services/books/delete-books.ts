"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { withPermissionCheck } from "@/common/auth/permission-wrapper";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import type { ServerAction } from "@/common/types";
import { booksCommandRepository } from "@/infrastructures/books/repositories/books-command-repository";

async function deleteBooksImpl(id: string): Promise<ServerAction> {
	const userId = await getSelfId();

	await booksCommandRepository.deleteById(id, userId, "UNEXPORTED");

	revalidateTag(`books_UNEXPORTED_${userId}`);
	revalidateTag(`books_count_UNEXPORTED_${userId}`);

	return { success: true, message: "deleted" };
}

export const deleteBooks = withPermissionCheck(
	hasDumperPostPermission,
	deleteBooksImpl,
);
