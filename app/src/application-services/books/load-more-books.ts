"use server";
import "server-only";
import type { ServerActionWithData } from "@/common/types";
import type { ImageCardStackInitialData } from "@/components/common/layouts/cards/types";
import { requireAuth } from "@/common/auth/session";
import { backendActionError } from "@/common/backend/action-error";
import { ListBooksParams } from "@s-hirano-ist/s-api-client/models";
import { getExportedBooks, getUnexportedBooks } from "./get-books";

export async function loadMoreExportedBooks(
	rawCurrentCount: unknown,
): Promise<ServerActionWithData<ImageCardStackInitialData>> {
	await requireAuth();

	try {
		const currentCount = ListBooksParams.shape.offset.parse(rawCurrentCount);
		const data = await getExportedBooks(currentCount);

		return {
			success: true,
			message: "success",
			data,
		};
	} catch (error) {
		return backendActionError(error);
	}
}

export async function loadMoreUnexportedBooks(
	rawCurrentCount: unknown,
): Promise<ServerActionWithData<ImageCardStackInitialData>> {
	await requireAuth();

	try {
		const currentCount = ListBooksParams.shape.offset.parse(rawCurrentCount);
		const data = await getUnexportedBooks(currentCount);

		return {
			success: true,
			message: "success",
			data,
		};
	} catch (error) {
		return backendActionError(error);
	}
}
