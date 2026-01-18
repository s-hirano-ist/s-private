/**
 * Image upload server action.
 *
 * @remarks
 * Handles image file upload with thumbnail generation and MinIO storage.
 *
 * @module
 */

"use server";
import "server-only";
import { imageEntity } from "@s-hirano-ist/s-core/images/entities/image-entity";
import { ImagesDomainService } from "@s-hirano-ist/s-core/images/services/images-domain-service";
import { revalidateTag } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/common/utils/cache-tag-builder";
import { minioStorageService } from "@/infrastructures/common/services/minio-storage-service";
import { imagesCommandRepository } from "@/infrastructures/images/repositories/images-command-repository";
import { imagesQueryRepository } from "@/infrastructures/images/repositories/images-query-repository";
import { parseAddImageFormData } from "./helpers/form-data-parser";

/**
 * Server action to upload a new image.
 *
 * @remarks
 * Performs the following steps:
 * 1. Permission check (dumper role required)
 * 2. Form data parsing with thumbnail generation
 * 3. Domain duplicate check (path uniqueness)
 * 4. Upload original and thumbnail to MinIO
 * 5. Create database record and invalidate cache
 *
 * @param formData - Form data containing the image file
 * @returns Server action result with success/failure status
 */
export async function addImage(formData: FormData): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	const imagesDomainService = new ImagesDomainService(imagesQueryRepository);

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

		const image = imageEntity.create({
			userId,
			path,
			contentType,
			fileSize,
		});

		await minioStorageService.uploadImage(image.path, originalBuffer, false);
		await minioStorageService.uploadImage(image.path, thumbnailBuffer, true);
		await imagesCommandRepository.create(image);

		// Cache invalidation
		revalidateTag(buildContentCacheTag("images", image.status, userId));
		revalidateTag(buildCountCacheTag("images", image.status, userId));

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
