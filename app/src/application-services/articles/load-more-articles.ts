"use server";
import "server-only";
import type { ServerActionWithData } from "@/common/types";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";
import { requireAuth } from "@/common/auth/session";
import { backendActionError } from "@/common/backend/action-error";
import { ListArticlesParams } from "@s-hirano-ist/s-api-client/models";
import { getExportedArticles, getUnexportedArticles } from "./get-articles";

export async function loadMoreExportedArticles(
	rawCurrentCount: unknown,
): Promise<ServerActionWithData<LinkCardStackInitialData>> {
	await requireAuth();

	try {
		const currentCount = ListArticlesParams.shape.offset.parse(rawCurrentCount);
		const data = await getExportedArticles(currentCount);

		return {
			success: true,
			message: "success",
			data,
		};
	} catch (error) {
		return backendActionError(error);
	}
}

export async function loadMoreUnexportedArticles(
	rawCurrentCount: unknown,
): Promise<ServerActionWithData<LinkCardStackInitialData>> {
	await requireAuth();

	try {
		const currentCount = ListArticlesParams.shape.offset.parse(rawCurrentCount);
		const data = await getUnexportedArticles(currentCount);

		return {
			success: true,
			message: "success",
			data,
		};
	} catch (error) {
		return backendActionError(error);
	}
}
