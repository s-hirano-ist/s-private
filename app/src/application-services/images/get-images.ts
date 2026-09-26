/**
 * Image query application services.
 *
 * @remarks
 * Provides cached data access for image batches and storage retrieval.
 * Images are served via API routes for original and thumbnail versions.
 *
 * @module
 */

import type { ImageData } from "@/components/common/display/image/image-stack";
import type { CardStackInitialData } from "@/components/common/layouts/cards/types";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import { tenantContext } from "@/common/tenant/tenant-context";
import { imagesQueryRepository } from "@/infrastructures/images/repositories/images-query-repository";
import {
	buildContentCacheTag,
	buildCountCacheTag,
	buildPaginatedContentCacheTag,
} from "@/infrastructures/shared/cache/cache-tag-builder";
import { minioStorageService } from "@/infrastructures/shared/storage/minio-storage-service";
import {
	makeExportedStatus,
	makeUnexportedStatus,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { unstable_cache } from "next/cache";
import { cache } from "react";

/** API path for original images */
const API_ORIGINAL_PATH = "/api/images/original";
/** API path for thumbnail images */
const API_THUMBNAIL_PATH = "/api/images/thumbnail";

/**
 * Gets total count of images for a user and status.
 *
 * @internal
 */
const getImagesCountCached = async (
	userId: UserId,
	status: Status,
): Promise<number> => {
	return unstable_cache(
		() => imagesQueryRepository.count(userId, status),
		["images", "count", userId, status],
		{ tags: [buildCountCacheTag("images", status, userId)] },
	)();
};

/**
 * Fetches a batch of images with API paths for display.
 *
 * @internal
 */
const getImagesCached = async (
	currentCount: number,
	userId: UserId,
	status: Status,
): Promise<CardStackInitialData<ImageData>> => {
	return unstable_cache(
		async () => {
			const [data, totalCount] = await Promise.all([
				imagesQueryRepository.findMany(userId, status, {
					skip: currentCount,
					take: PAGE_SIZE,
					orderBy: { createdAt: "desc" },
				}),
				getImagesCountCached(userId, status),
			]);

			return {
				data: data.map((d) => ({
					id: d.id,
					originalPath: `${API_ORIGINAL_PATH}/${d.path}`,
					thumbnailPath: `${API_THUMBNAIL_PATH}/${d.path}`,
					height: d.height,
					width: d.width,
				})),
				totalCount,
			};
		},
		["images", "list", userId, status, String(currentCount)],
		{
			tags: [
				buildContentCacheTag("images", status, userId),
				buildPaginatedContentCacheTag("images", status, userId, currentCount),
			],
		},
	)();
};

/**
 * Gets the total count of images for a given status.
 *
 * @param status - Image status filter (UNEXPORTED/EXPORTED)
 * @returns Total count of matching images
 */
export const getImagesCount = async (status: Status): Promise<number> => {
	const userId = await getSelfId();
	return tenantContext.run({ userId }, () =>
		getImagesCountCached(userId, status),
	);
};

/**
 * Fetches paginated exported images for the current user.
 *
 * @param currentCount - Number of images already loaded
 * @returns Image data and total count
 */
export const getExportedImages = cache(
	async (currentCount: number): Promise<CardStackInitialData<ImageData>> => {
		const userId = await getSelfId();
		return tenantContext.run({ userId }, () =>
			getImagesCached(currentCount, userId, makeExportedStatus().status),
		);
	},
);

/**
 * Fetches paginated unexported images for the current user.
 *
 * @param currentCount - Number of images already loaded
 * @returns Image data and total count
 */
export const getUnexportedImages = cache(
	async (currentCount: number): Promise<CardStackInitialData<ImageData>> => {
		const userId = await getSelfId();
		return tenantContext.run({ userId }, () =>
			getImagesCached(currentCount, userId, makeUnexportedStatus()),
		);
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
