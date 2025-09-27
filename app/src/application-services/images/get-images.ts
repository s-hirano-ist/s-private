import { unstable_cacheTag as cacheTag } from "next/cache";
import { cache } from "react";
import {
	makeStatus,
	type Status,
	type UserId,
} from "s-private-domains/common/entities/common-entity";
import type { CacheStrategy } from "s-private-domains/images/types/cache-strategy";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import type { ImageData } from "@/components/common/display/image/image-stack";
import { imagesQueryRepository } from "@/infrastructures/images/repositories/images-query-repository";

const API_ORIGINAL_PATH = "/api/images/original";
const API_THUMBNAIL_PATH = "/api/images/thumbnail";

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

export const getImagesCount = async (status: Status): Promise<number> => {
	const userId = await getSelfId();
	return await _getImagesCount(userId, status);
};

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

export const getUnexportedImages = cache(
	async (page: number): Promise<ImageData[]> => {
		const userId = await getSelfId();
		return _getImages(page, userId, makeStatus("UNEXPORTED"));
	},
);

export const getImagesFromStorage = async (
	path: string,
	isThumbnail: boolean,
) => {
	"use cache";
	cacheTag(`images_storage_${path}_${isThumbnail}`);
	try {
		return await imagesQueryRepository.getFromStorage(path, isThumbnail);
	} catch (error) {
		throw error;
	}
};
