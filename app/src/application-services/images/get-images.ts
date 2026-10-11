import type { ImageData } from "@/components/common/display/image/image-stack";
import type { CardStackInitialData } from "@/components/common/layouts/cards/types";
import type { ContentStatus } from "@s-hirano-ist/s-api-client/models";
import { getBackendClient } from "@/common/backend/server-client";
import { PAGE_SIZE } from "@/common/constants";
import { cache } from "react";
const page = cache(
	async (
		offset: number,
		status: ContentStatus,
	): Promise<CardStackInitialData<ImageData>> => {
		const { data } = await (
			await getBackendClient()
		).listImages({ offset, limit: PAGE_SIZE, status });
		return {
			data: data.data.map((image) => ({
				id: image.id,
				alt: `Image ${image.path}`,
				originalPath: `/api/v1/media/images/${encodeURIComponent(image.id)}/original`,
				thumbnailPath: `/api/v1/media/images/${encodeURIComponent(image.id)}/thumbnail`,
				height: image.height,
				width: image.width,
			})),
			totalCount: data.totalCount,
		};
	},
);
export const getImagesCount = cache(
	async (status: ContentStatus) =>
		(await (await getBackendClient()).countImages({ status })).data.count,
);
export const getExportedImages = (offset: number) => page(offset, "EXPORTED");
export const getUnexportedImages = (offset: number) =>
	page(offset, "UNEXPORTED");
