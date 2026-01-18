/**
 * Core business logic for book creation.
 *
 * @remarks
 * NOT a Server Action - for internal use and testing only.
 *
 * @module
 */

import "server-only";
import { bookEntity } from "@s-hirano-ist/s-core/books/entities/books-entity";
import { revalidateTag } from "next/cache";
import { getSelfId } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/common/utils/cache-tag-builder";
import type { AddBooksDeps } from "./add-books.deps";
import { parseAddBooksFormData } from "./helpers/form-data-parser";

/**
 * Core business logic for creating a book.
 *
 * @remarks
 * This function contains the pure business logic without authentication/authorization.
 * It is designed to be easily testable by accepting dependencies as parameters.
 *
 * @param formData - Form data containing ISBN and title
 * @param deps - Dependencies (repository, storage service, domain service factory, event dispatcher)
 * @returns Server action result with success/failure status
 */
export async function addBooksCore(
	formData: FormData,
	deps: AddBooksDeps,
): Promise<ServerAction> {
	const {
		commandRepository,
		storageService,
		domainServiceFactory,
		eventDispatcher,
	} = deps;
	const booksDomainService = domainServiceFactory.createBooksDomainService();

	try {
		const parsedData = await parseAddBooksFormData(formData, await getSelfId());

		// Domain business rule validation
		await booksDomainService.ensureNoDuplicate(
			parsedData.ISBN,
			parsedData.userId,
		);

		// Upload image to MinIO if provided
		if (parsedData.hasImage) {
			await storageService.uploadImage(
				parsedData.path,
				parsedData.originalBuffer,
				false,
			);
			await storageService.uploadImage(
				parsedData.path,
				parsedData.thumbnailBuffer,
				true,
			);
		}

		// Create entity with value objects and domain event
		const [book, event] = bookEntity.create({
			ISBN: parsedData.ISBN,
			title: parsedData.title,
			userId: parsedData.userId,
			imagePath: parsedData.imagePath,
			caller: "addBooks",
		});

		// Persist
		await commandRepository.create(book);

		// Dispatch domain event
		await eventDispatcher.dispatch(event);

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
