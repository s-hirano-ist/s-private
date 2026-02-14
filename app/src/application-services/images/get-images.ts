/**
 * Image query application services.
 *
 * @remarks
 * Provides cached data access for images with pagination and storage retrieval.
 * Images are served via API routes for original and thumbnail versions.
 *
 * @module
 */

import {
	makeExportedStatus,
	makeUnexportedStatus,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { cacheTag } from "next/cache";
import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import type { ImageData } from "@/components/common/display/image/image-stack";
import { imagesQueryRepository } from "@/infrastructures/images/repositories/images-query-repository";
import {
	buildContentCacheTag,
	buildCountCacheTag,
	buildPaginatedContentCacheTag,
} from "@/infrastructures/shared/cache/cache-tag-builder";
import { minioStorageService } from "@/infrastructures/shared/storage/minio-storage-service";

/** API path for original images */
const API_ORIGINAL_PATH = "/api/images/original";
/** API path for thumbnail images */
const API_THUMBNAIL_PATH = "/api/images/thumbnail";

/**
 * Gets total count of images for a user and status.
 *
 * @internal
 */
const _getImagesCount = async (
	userId: UserId,
	status: Status,
): Promise<number> => {
	"use cache";
	cacheTag(buildCountCacheTag("images", status, userId));
	return await imagesQueryRepository.count(userId, status);
};

/**
 * Fetches paginated images with API paths for display.
 *
 * @internal
 */
const _getImages = async (
	page: number,
	userId: UserId,
	status: Status,
): Promise<ImageData[]> => {
	"use cache";
	cacheTag(
		buildContentCacheTag("images", status, userId),
		buildPaginatedContentCacheTag("images", status, userId, page),
	);
	const data = await imagesQueryRepository.findMany(userId, status, {
		skip: (page - 1) * PAGE_SIZE,
		take: PAGE_SIZE,
		orderBy: { createdAt: "desc" },
	});

	return data.map((d) => {
		return {
			id: d.id,
			originalPath: `${API_ORIGINAL_PATH}/${d.path}`,
			thumbnailPath: `${API_THUMBNAIL_PATH}/${d.path}`,
			height: d.height,
			width: d.width,
		};
	});
};

/**
 * Gets the total count of images for a given status.
 *
 * @param status - Image status filter (UNEXPORTED/EXPORTED)
 * @returns Total count of matching images
 */
export const getImagesCount = async (status: Status): Promise<number> => {
	const userId = await getSelfId();
	return await _getImagesCount(userId, status);
};

/**
 * Fetches paginated exported images for the current user.
 *
 * @param page - Page number (1-based)
 * @returns Array of image data with API paths
 */
export const getExportedImages = cache(
	async (page: number): Promise<ImageData[]> => {
		const userId = await getSelfId();
		return _getImages(page, userId, makeExportedStatus().status);
	},
);

/**
 * Fetches paginated unexported images for the current user.
 *
 * @param page - Page number (1-based)
 * @returns Array of image data with API paths
 */
export const getUnexportedImages = cache(
	async (page: number): Promise<ImageData[]> => {
		const userId = await getSelfId();
		return _getImages(page, userId, makeUnexportedStatus());
	},
);

/**
 * Retrieves image binary data from MinIO storage.
 *
 * @param path - Image path in storage
 * @param isThumbnail - Whether to fetch thumbnail version
 * @returns Image binary data
 */
export const getImagesFromStorage = async (
	path: string,
	isThumbnail: boolean,
) => {
	return await minioStorageService.getImage(path, isThumbnail);
};
