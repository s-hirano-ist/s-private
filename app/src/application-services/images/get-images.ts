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
	makeStatus,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/common/entities/common-entity";
import type { CacheStrategy } from "@s-hirano-ist/s-core/images/types/cache-strategy";
import { unstable_cacheTag as cacheTag } from "next/cache";
import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import type { ImageData } from "@/components/common/display/image/image-stack";
import { imagesQueryRepository } from "@/infrastructures/images/repositories/images-query-repository";

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
	cacheTag(`images_count_${status}_${userId}`);
	try {
		return await imagesQueryRepository.count(userId, status);
	} catch (error) {
		throw error;
	}
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
	cacheStrategy?: CacheStrategy,
): Promise<ImageData[]> => {
	"use cache";
	cacheTag(`images_${status}_${userId}`, `images_${status}_${userId}_${page}`);
	try {
		const data = await imagesQueryRepository.findMany(userId, status, {
			skip: (page - 1) * PAGE_SIZE,
			take: PAGE_SIZE,
			orderBy: { createdAt: "desc" },
			cacheStrategy,
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
	} catch (error) {
		throw error;
	}
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
 * @remarks
 * Uses Prisma Accelerate caching for viewer performance.
 *
 * @param page - Page number (1-based)
 * @returns Array of image data with API paths
 */
export const getExportedImages = cache(
	async (page: number): Promise<ImageData[]> => {
		const userId = await getSelfId();
		return _getImages(page, userId, makeStatus("EXPORTED"), {
			ttl: 400,
			swr: 40,
			tags: [`${sanitizeCacheTag(userId)}_images`],
		});
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
		return _getImages(page, userId, makeStatus("UNEXPORTED"));
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
	return await imagesQueryRepository.getFromStorage(path, isThumbnail);
};
