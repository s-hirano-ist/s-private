"use server";
import "server-only";
import type { ServerActionWithData } from "@/common/types";
import type { ImageData } from "@/components/common/display/image/image-stack";
import type { CardStackInitialData } from "@/components/common/layouts/cards/types";
import { requireAuth } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { paginationCountSchema } from "@s-hirano-ist/s-core/shared-kernel/types/query-options";
import { getExportedImages, getUnexportedImages } from "./get-images";

type ImagesResult = ServerActionWithData<CardStackInitialData<ImageData>>;

export async function loadMoreExportedImages(
	rawCurrentCount: unknown,
): Promise<ImagesResult> {
	await requireAuth();
	try {
		const currentCount = paginationCountSchema.parse(rawCurrentCount);
		return {
			success: true,
			message: "success",
			data: await getExportedImages(currentCount),
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}

export async function loadMoreUnexportedImages(
	rawCurrentCount: unknown,
): Promise<ImagesResult> {
	await requireAuth();
	try {
		const currentCount = paginationCountSchema.parse(rawCurrentCount);
		return {
			success: true,
			message: "success",
			data: await getUnexportedImages(currentCount),
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
