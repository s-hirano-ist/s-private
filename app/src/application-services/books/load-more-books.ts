"use server";
import "server-only";
import { paginationCountSchema } from "@s-hirano-ist/s-core/shared-kernel/types/query-options";
import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerActionWithData } from "@/common/types";
import type { ImageCardStackInitialData } from "@/components/common/layouts/cards/types";
import { getExportedBooks, getUnexportedBooks } from "./get-books";

export async function loadMoreExportedBooks(
	rawCurrentCount: unknown,
): Promise<ServerActionWithData<ImageCardStackInitialData>> {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const currentCount = paginationCountSchema.parse(rawCurrentCount);
		const data = await getExportedBooks(currentCount);

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
	rawCurrentCount: unknown,
): Promise<ServerActionWithData<ImageCardStackInitialData>> {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const currentCount = paginationCountSchema.parse(rawCurrentCount);
		const data = await getUnexportedBooks(currentCount);

		return {
			success: true,
			message: "success",
			data,
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
