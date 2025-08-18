"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import { makeStatus } from "@/domains/common/entities/common-entity";
import { booksCommandRepository } from "@/infrastructures/books/repositories/books-command-repository";

export async function deleteBooks(id: string): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		await booksCommandRepository.deleteById(
			id,
			userId,
			makeStatus("UNEXPORTED"),
		);

		revalidateTag(`books_UNEXPORTED_${userId}`);
		revalidateTag(`books_count_UNEXPORTED_${userId}`);

		return { success: true, message: "deleted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
