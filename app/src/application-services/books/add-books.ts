/**
 * Book creation server action.
 *
 * @remarks
 * Handles book creation with ISBN validation and duplicate checking.
 *
 * @module
 */

"use server";
import "server-only";
import { bookEntity } from "@s-hirano-ist/s-core/books/entities/books-entity";
import { BooksDomainService } from "@s-hirano-ist/s-core/books/services/books-domain-service";
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
import { booksQueryRepository } from "@/infrastructures/books/repositories/books-query-repository";
import { booksStorageService } from "@/infrastructures/books/services/books-storage-service";
import { parseAddBooksFormData } from "./helpers/form-data-parser";

/**
 * Server action to create a new book record.
 *
 * @remarks
 * Validates ISBN uniqueness and creates book with Google Books metadata.
 * Requires dumper role permission.
 *
 * @param formData - Form data containing ISBN and title
 * @returns Server action result with success/failure status
 */
export async function addBooks(formData: FormData): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	const booksDomainService = new BooksDomainService(booksQueryRepository);

	try {
		const parsedData = await parseAddBooksFormData(formData, await getSelfId());

		// Domain business rule validation
		await booksDomainService.ensureNoDuplicate(
			parsedData.ISBN,
			parsedData.userId,
		);

		// Upload image to MinIO if provided
		if (parsedData.hasImage) {
			await booksStorageService.uploadImage(
				parsedData.path,
				parsedData.originalBuffer,
				false,
			);
			await booksStorageService.uploadImage(
				parsedData.path,
				parsedData.thumbnailBuffer,
				true,
			);
		}

		// Create entity with value objects
		const book = bookEntity.create({
			ISBN: parsedData.ISBN,
			title: parsedData.title,
			userId: parsedData.userId,
			imagePath: parsedData.imagePath,
		});

		// Persist
		await booksCommandRepository.create(book);

		// Cache invalidation
		revalidateTag(
			buildContentCacheTag("books", book.status, parsedData.userId),
		);
		revalidateTag(buildCountCacheTag("books", book.status, parsedData.userId));

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
