"use server";
import "server-only";
import {
	makeExportedStatus,
	makeUnexportedStatus,
} from "@s-hirano-ist/s-core/common/entities/common-entity";
import { forbidden } from "next/navigation";
import { getSelfId, hasViewerAdminPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerActionWithData } from "@/common/types";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import type { ImageCardStackInitialData } from "@/components/common/layouts/cards/types";
import { _getBooks } from "./get-books";

export async function loadMoreExportedBooks(
	currentCount: number,
): Promise<ServerActionWithData<ImageCardStackInitialData>> {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		const data = await _getBooks(
			currentCount,
			userId,
			makeExportedStatus().status,
			{
				ttl: 400,
				swr: 40,
				tags: [`${sanitizeCacheTag(userId)}_books_${currentCount}`],
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

export async function loadMoreUnexportedBooks(
	currentCount: number,
): Promise<ServerActionWithData<ImageCardStackInitialData>> {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		const data = await _getBooks(currentCount, userId, makeUnexportedStatus());

		return {
			success: true,
			message: "success",
			data,
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
