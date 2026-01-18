/**
 * Core business logic for image upload.
 *
 * @remarks
 * NOT a Server Action - for internal use and testing only.
 *
 * @module
 */

import "server-only";
import { imageEntity } from "@s-hirano-ist/s-core/images/entities/image-entity";
import { revalidateTag } from "next/cache";
import { getSelfId } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/common/utils/cache-tag-builder";
import { type AddImageDeps, createImagesDomainService } from "./add-image.deps";
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
		queryRepository,
		storageService,
		eventDispatcher,
	} = deps;
	const imagesDomainService = createImagesDomainService(queryRepository);

	try {
		const {
			userId,
			path,
			contentType,
			fileSize,
			thumbnailBuffer,
			originalBuffer,
		} = await parseAddImageFormData(formData, await getSelfId());

		// Domain business rule validation
		await imagesDomainService.ensureNoDuplicate(path, userId);

		// Create entity with value objects and domain event
		const [image, event] = imageEntity.create({
			userId,
			path,
			contentType,
			fileSize,
			caller: "addImage",
		});

		await storageService.uploadImage(image.path, originalBuffer, false);
		await storageService.uploadImage(image.path, thumbnailBuffer, true);
		await commandRepository.create(image);

		// Dispatch domain event
		await eventDispatcher.dispatch(event);

		// Cache invalidation
		revalidateTag(buildContentCacheTag("images", image.status, userId));
		revalidateTag(buildCountCacheTag("images", image.status, userId));

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
