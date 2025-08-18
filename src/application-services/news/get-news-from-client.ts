"use server";
import "server-only";
import { forbidden } from "next/navigation";
import { getSelfId, hasViewerAdminPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { ServerActionWithData } from "@/common/types";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import type { LinkCardData } from "@/components/common/layouts/cards/types";
import { _getNews } from "./get-news";

export async function loadMoreExportedNews(
	currentCount: number,
): Promise<ServerActionWithData<{ data: LinkCardData[]; totalCount: number }>> {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	const userId = await getSelfId();

	const data = await _getNews(currentCount, userId, "EXPORTED", {
		ttl: 400,
		swr: 40,
		tags: [`${sanitizeCacheTag(userId)}_news_${currentCount}`],
	});
	try {
		return {
			success: true,
			message: "success",
			data,
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}

export async function loadMoreUnexportedNews(
	currentCount: number,
): Promise<ServerActionWithData<{ data: LinkCardData[]; totalCount: number }>> {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	const userId = await getSelfId();

	const data = await _getNews(currentCount, userId, "UNEXPORTED");
	try {
		return {
			success: true,
			message: "success",
			data,
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
