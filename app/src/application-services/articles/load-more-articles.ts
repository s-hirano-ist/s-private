"use server";
import "server-only";
import {
	makeExportedStatus,
	makeUnexportedStatus,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { forbidden } from "next/navigation";
import { getSelfId, hasViewerAdminPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerActionWithData } from "@/common/types";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";
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
			makeExportedStatus().status,
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
			makeUnexportedStatus(),
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
