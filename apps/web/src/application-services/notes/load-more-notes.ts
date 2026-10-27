"use server";
import "server-only";
import type { ServerActionWithData } from "@/common/types";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";
import { requireAuth } from "@/common/auth/session";
import { backendActionError } from "@/common/backend/action-error";
import { ListNotesParams } from "@s-hirano-ist/s-api-client/models";
import { getExportedNotes, getUnexportedNotes } from "./get-notes";

export async function loadMoreExportedNotes(
	rawCurrentCount: unknown,
): Promise<ServerActionWithData<LinkCardStackInitialData>> {
	await requireAuth();

	try {
		const currentCount = ListNotesParams.shape.offset.parse(rawCurrentCount);
		const data = await getExportedNotes(currentCount);

		return {
			success: true,
			message: "success",
			data,
		};
	} catch (error) {
		return backendActionError(error);
	}
}

export async function loadMoreUnexportedNotes(
	rawCurrentCount: unknown,
): Promise<ServerActionWithData<LinkCardStackInitialData>> {
	await requireAuth();

	try {
		const currentCount = ListNotesParams.shape.offset.parse(rawCurrentCount);
		const data = await getUnexportedNotes(currentCount);

		return {
			success: true,
			message: "success",
			data,
		};
	} catch (error) {
		return backendActionError(error);
	}
}
