"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { withPermissionCheck } from "@/common/auth/permission-wrapper";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import type { ServerAction } from "@/common/types";
import { BooksDomainService } from "@/domains/books/services/books-domain-service";
import { booksCommandRepository } from "@/infrastructures/books/repositories/books-command-repository";
import { booksQueryRepository } from "@/infrastructures/books/repositories/books-query-repository";

async function addBooksImpl(formData: FormData): Promise<ServerAction> {
	const userId = await getSelfId();

	const validatedBooks = await new BooksDomainService(
		booksQueryRepository,
	).prepareNewBook(formData, userId);

	await booksCommandRepository.create(validatedBooks);

	revalidateTag(`books_UNEXPORTED_${userId}`);
	revalidateTag(`books_count_UNEXPORTED_${userId}`);

	return { success: true, message: "inserted" };
}

export const addBooks = withPermissionCheck(
	hasDumperPostPermission,
	addBooksImpl,
);
