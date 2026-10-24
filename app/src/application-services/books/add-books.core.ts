/**
 * Core business logic for book creation.
 *
 * @remarks
 * NOT a Server Action - for internal use and testing only.
 *
 * @module
 */

import "server-only";
import type { AddBooksDeps } from "@/application-services/books/add-books.deps";
import type { ServerActionWithData } from "@/common/types";
import { parseAddBooksFormData } from "@/application-services/books/helpers/form-data-parser";
import { getSelfId } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { withOperationPhase } from "@/common/error/operation-phase-error";
import { createBook } from "@s-hirano-ist/s-backend/books/use-cases";
import {
	makeUserId,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";

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
	principalId?: UserId,
): Promise<ServerActionWithData<{ id: string }>> {
	try {
		const uploadFile = formData.get("image");
		const phaseContext =
			uploadFile instanceof File
				? {
						action: "addBooks",
						fileName: uploadFile.name,
						fileSize: uploadFile.size,
						contentType: uploadFile.type,
					}
				: { action: "addBooks" };

		const parsedData = await withOperationPhase(
			{ ...phaseContext, phase: "parse-form-data" },
			async () =>
				parseAddBooksFormData(
					formData,
					principalId ?? makeUserId(await getSelfId()),
				),
		);

		const result = await createBook(parsedData, deps, phaseContext);
		return { success: true, message: "inserted", data: result };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
