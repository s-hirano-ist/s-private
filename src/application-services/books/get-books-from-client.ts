"use server";
import "server-only";
import { forbidden } from "next/navigation";
import { getSelfId, hasViewerAdminPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerActionWithData } from "@/common/types";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import type { ImageCardStackInitialData } from "@/components/common/layouts/cards/types";
import { makeStatus } from "@/domains/common/entities/common-entity";
import { _getBooks } from "./get-books";

export async function loadMoreExportedBooks(
	currentCount: number,
): Promise<ServerActionWithData<ImageCardStackInitialData>> {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	const userId = await getSelfId();

	const data = await _getBooks(currentCount, userId, makeStatus("EXPORTED"), {
		ttl: 400,
		swr: 40,
		tags: [`${sanitizeCacheTag(userId)}_books_${currentCount}`],
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

export async function loadMoreUnexportedBooks(
	currentCount: number,
): Promise<ServerActionWithData<ImageCardStackInitialData>> {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	const userId = await getSelfId();

	const data = await _getBooks(currentCount, userId, makeStatus("UNEXPORTED"));
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
