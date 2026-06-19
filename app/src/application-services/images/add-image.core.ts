/**
 * Core business logic for image upload.
 *
 * @remarks
 * NOT a Server Action - for internal use and testing only.
 *
 * @module
 */

import "server-only";
import type { AddImageDeps } from "./add-image.deps";
import type { ServerAction } from "@/common/types";
import { getSelfId } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { withOperationPhase } from "@/common/error/operation-phase-error";
import { withStoragePhase } from "@/common/error/storage-phase-error";
import { imageEntity } from "@s-hirano-ist/s-core/images/entities/image-entity";
import { parseAddImageFormData } from "./helpers/form-data-parser";

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
): Promise<ServerAction> {
	const {
		commandRepository,
		storageService,
		domainServiceFactory,
		eventDispatcher,
	} = deps;
	const imagesDomainService = domainServiceFactory.createImagesDomainService();

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

		const {
			userId,
			path,
			contentType,
			fileSize,
			thumbnailBuffer,
			originalBuffer,
		} = await withOperationPhase(
			{ ...phaseContext, phase: "parse-form-data" },
			async () => parseAddImageFormData(formData, await getSelfId()),
		);

		// Domain business rule validation
		await withOperationPhase(
			{ ...phaseContext, phase: "validate-domain" },
			() => imagesDomainService.ensureNoDuplicate(path, userId),
		);

		// Create entity with value objects and domain event
		const [image, event] = await withOperationPhase(
			{ ...phaseContext, phase: "create-entity" },
			async () =>
				imageEntity.create({
					userId,
					path,
					contentType,
					fileSize,
					caller: "addImage",
				}),
		);

		const storageContext = {
			action: "addImage",
			path,
			fileSize,
			contentType,
		};

		await withStoragePhase(
			{
				phase: "upload-original",
				path: image.path,
				isThumbnail: false,
				additionalContext: storageContext,
			},
			() => storageService.uploadImage(image.path, originalBuffer, false),
		);
		await withStoragePhase(
			{
				phase: "upload-thumbnail",
				path: image.path,
				isThumbnail: true,
				additionalContext: storageContext,
			},
			() => storageService.uploadImage(image.path, thumbnailBuffer, true),
		);
		// Cache invalidation is handled in repository
		await withOperationPhase({ ...phaseContext, phase: "create-record" }, () =>
			commandRepository.create(image),
		);

		// Dispatch domain event
		await withOperationPhase({ ...phaseContext, phase: "dispatch-event" }, () =>
			eventDispatcher.dispatch(event),
		);

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
