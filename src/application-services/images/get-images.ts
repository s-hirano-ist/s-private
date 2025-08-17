import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import { ImageData } from "@/components/common/display/image/image-stack";
import type { Status } from "@/domains/common/entities/common-entity";
import { imagesQueryRepository } from "@/infrastructures/images/repositories/images-query-repository";

const API_ORIGINAL_PATH = "/api/images/original";
const API_THUMBNAIL_PATH = "/api/images/thumbnail";

const _getExportedImages = async (page: number): Promise<ImageData[]> => {
	try {
		const userId = await getSelfId();
		const data = await imagesQueryRepository.findMany(userId, "EXPORTED", {
			skip: (page - 1) * PAGE_SIZE,
			take: PAGE_SIZE,
			orderBy: { createdAt: "desc" },
			cacheStrategy: { ttl: 400, swr: 40, tags: ["images"] },
		});
		return data.map((d) => {
			return {
				id: d.id,
				originalPath: API_ORIGINAL_PATH + "/" + d.path,
				thumbnailPath: API_THUMBNAIL_PATH + "/" + d.path,
				height: d.height,
				width: d.width,
			};
		});
	} catch (error) {
		throw error;
	}
};

export const getExportedImages = unstable_cache(
	_getExportedImages,
	["images-exported"],
	{ tags: ["images-exported"], revalidate: 400 },
);

const _getUnexportedImages = async (): Promise<ImageData[]> => {
	try {
		const userId = await getSelfId();
		const data = await imagesQueryRepository.findMany(userId, "UNEXPORTED", {
			orderBy: { createdAt: "desc" },
		});
		return data.map((d) => {
			return {
				id: d.id,
				originalPath: API_ORIGINAL_PATH + "/" + d.path,
				thumbnailPath: API_THUMBNAIL_PATH + "/" + d.path,
				height: d.height,
				width: d.width,
			};
		});
	} catch (error) {
		throw error;
	}
};

export const getUnexportedImages = unstable_cache(
	_getUnexportedImages,
	["images-unexported"],
	{ tags: ["images-unexported"], revalidate: 300 },
);

const _getImagesCount = async (
	status: Status,
): Promise<{ count: number; pageSize: number }> => {
	try {
		const userId = await getSelfId();
		return {
			count: await imagesQueryRepository.count(userId, status),
			pageSize: PAGE_SIZE,
		};
	} catch (error) {
		throw error;
	}
};

export const getImagesCount = (status: Status) =>
	unstable_cache(() => _getImagesCount(status), [`images-count-${status}`], {
		tags: [`images-count-${status}`],
		revalidate: 60,
	})();

export const getImagesFromStorage = async (
	path: string,
	isThumbnail: boolean,
) => {
	try {
		return await imagesQueryRepository.getFromStorage(path, isThumbnail);
	} catch (error) {
		throw error;
	}
};
