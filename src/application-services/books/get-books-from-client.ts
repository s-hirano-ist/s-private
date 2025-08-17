"use server";
import "server-only";
import { forbidden } from "next/navigation";
import { getSelfId, hasViewerAdminPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { ServerActionWithData } from "@/common/types";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import { ImageCardData } from "@/components/common/layouts/cards/image-card";
import { _getBooks } from "./get-books";

export async function loadMoreExportedBooks(
	currentCount: number,
): Promise<
	ServerActionWithData<{ data: ImageCardData[]; totalCount: number }>
> {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	const userId = await getSelfId();

	const data = await _getBooks(currentCount, userId, "EXPORTED", {
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
): Promise<
	ServerActionWithData<{ data: ImageCardData[]; totalCount: number }>
> {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	const userId = await getSelfId();

	const data = await _getBooks(currentCount, userId, "UNEXPORTED");
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
