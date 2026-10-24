/**
 * Core business logic for image upload.
 *
 * @remarks
 * NOT a Server Action - for internal use and testing only.
 *
 * @module
 */

import "server-only";
import type { AddImageDeps } from "@/application-services/images/add-image.deps";
import type { ServerActionWithData } from "@/common/types";
import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { parseAddImageFormData } from "@/application-services/images/helpers/form-data-parser";
import { getSelfId } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { withOperationPhase } from "@/common/error/operation-phase-error";
import { createImage } from "@s-hirano-ist/s-backend/images/use-cases";

/**
 * Core business logic for uploading an image.
 *
 * @remarks
 * This function contains the pure business logic without authentication/authorization.
 * It is designed to be easily testable by accepting dependencies as parameters.
 *
 * @param formData - Form data containing the image file
 * @param deps - Dependencies (repositories, storage service)
 * @returns Server action result with success/failure status
 */
export async function addImageCore(
	formData: FormData,
	deps: AddImageDeps,
	principalId?: UserId,
): Promise<ServerActionWithData<{ id: string }>> {
	try {
		const uploadFile = formData.get("file");
		const phaseContext =
			uploadFile instanceof File
				? {
						action: "addImage",
						fileName: uploadFile.name,
						fileSize: uploadFile.size,
						contentType: uploadFile.type,
					}
				: { action: "addImage" };

		const parsedData = await withOperationPhase(
			{ ...phaseContext, phase: "parse-form-data" },
			async () =>
				parseAddImageFormData(formData, principalId ?? (await getSelfId())),
		);

		const result = await createImage(parsedData, deps, phaseContext);
		return { success: true, message: "inserted", data: result };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
