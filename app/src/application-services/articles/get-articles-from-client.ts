"use server";
import "server-only";
import { forbidden } from "next/navigation";
import { getSelfId, hasViewerAdminPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerActionWithData } from "@/common/types";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";
import { makeStatus } from "@/domains/common/entities/common-entity";
import { _getArticles } from "./get-articles";

export async function loadMoreExportedArticles(
	currentCount: number,
): Promise<ServerActionWithData<LinkCardStackInitialData>> {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		const data = await _getArticles(
			currentCount,
			userId,
			makeStatus("EXPORTED"),
			{
				ttl: 400,
				swr: 40,
				tags: [`${sanitizeCacheTag(userId)}_articles_${currentCount}`],
			},
		);

		return {
			success: true,
			message: "success",
			data,
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}

export async function loadMoreUnexportedArticles(
	currentCount: number,
): Promise<ServerActionWithData<LinkCardStackInitialData>> {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		const data = await _getArticles(
			currentCount,
			userId,
			makeStatus("UNEXPORTED"),
		);

		return {
			success: true,
			message: "success",
			data,
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
