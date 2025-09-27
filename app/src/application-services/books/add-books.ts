"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/common/utils/cache-tag-builder";
import { bookEntity } from "@/domains/books/entities/books-entity";
import { BooksDomainService } from "@/domains/books/services/books-domain-service";
import { booksCommandRepository } from "@/infrastructures/books/repositories/books-command-repository";
import { booksQueryRepository } from "@/infrastructures/books/repositories/books-query-repository";
import { parseAddBooksFormData } from "./helpers/form-data-parser";

export async function addBooks(formData: FormData): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	const booksDomainService = new BooksDomainService(booksQueryRepository);

	try {
		const { ISBN, title, userId } = parseAddBooksFormData(
			formData,
			await getSelfId(),
		);

		// Domain business rule validation
		await booksDomainService.ensureNoDuplicate(ISBN, userId);

		// Create entity with value objects
		const book = bookEntity.create({
			ISBN,
			title,
			userId,
		});

		// Persist
		await booksCommandRepository.create(book);

		// Cache invalidation
		revalidateTag(buildContentCacheTag("books", book.status, userId));
		revalidateTag(buildCountCacheTag("books", book.status, userId));

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
