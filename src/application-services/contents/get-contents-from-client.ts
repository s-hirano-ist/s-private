"use server";
import "server-only";
import { forbidden } from "next/navigation";
import { getSelfId, hasViewerAdminPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerActionWithData } from "@/common/types";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import type {
	LinkCardData,
	LinkCardStackInitialData,
} from "@/components/common/layouts/cards/types";
import { _getContents } from "./get-contents";

export async function loadMoreExportedContents(
	currentCount: number,
): Promise<ServerActionWithData<LinkCardStackInitialData>> {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	const userId = await getSelfId();

	const data = await _getContents(currentCount, userId, "EXPORTED", {
		ttl: 400,
		swr: 40,
		tags: [`${sanitizeCacheTag(userId)}_contents_${currentCount}`],
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

export async function loadMoreUnexportedContents(
	currentCount: number,
): Promise<ServerActionWithData<LinkCardStackInitialData>> {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	const userId = await getSelfId();

	const data = await _getContents(currentCount, userId, "UNEXPORTED");
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
