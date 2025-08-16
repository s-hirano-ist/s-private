"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import { BooksDomainService } from "@/domains/books/services/books-domain-service";
import { booksCommandRepository } from "@/infrastructures/books/repositories/books-command-repository";
import { booksQueryRepository } from "@/infrastructures/books/repositories/books-query-repository";

export async function addBooks(formData: FormData): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		// Extract form data directly
		const isbn = formData.get("isbn") as string;
		const title = formData.get("title") as string;

		// Use new domain service method
		const bookEntity = await new BooksDomainService(
			booksQueryRepository,
		).validateAndCreateBook({
			isbn,
			title,
			userId,
		});

		await booksCommandRepository.create(bookEntity);

		revalidatePath("/(dumper)");

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
