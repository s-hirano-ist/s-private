"use server";
import "server-only";
import { paginationCountSchema } from "@s-hirano-ist/s-core/shared-kernel/types/query-options";
import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerActionWithData } from "@/common/types";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";
import { getExportedArticles, getUnexportedArticles } from "./get-articles";

export async function loadMoreExportedArticles(
	rawCurrentCount: unknown,
): Promise<ServerActionWithData<LinkCardStackInitialData>> {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const currentCount = paginationCountSchema.parse(rawCurrentCount);
		const data = await getExportedArticles(currentCount);

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
	rawCurrentCount: unknown,
): Promise<ServerActionWithData<LinkCardStackInitialData>> {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const currentCount = paginationCountSchema.parse(rawCurrentCount);
		const data = await getUnexportedArticles(currentCount);

		return {
			success: true,
			message: "success",
			data,
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
