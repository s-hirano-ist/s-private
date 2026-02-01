"use server";
import "server-only";
import { paginationCountSchema } from "@s-hirano-ist/s-core/shared-kernel/types/query-options";
import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerActionWithData } from "@/common/types";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";
import { getExportedNotes, getUnexportedNotes } from "./get-notes";

export async function loadMoreExportedNotes(
	rawCurrentCount: unknown,
): Promise<ServerActionWithData<LinkCardStackInitialData>> {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const currentCount = paginationCountSchema.parse(rawCurrentCount);
		const data = await getExportedNotes(currentCount);

		return {
			success: true,
			message: "success",
			data,
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}

export async function loadMoreUnexportedNotes(
	rawCurrentCount: unknown,
): Promise<ServerActionWithData<LinkCardStackInitialData>> {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const currentCount = paginationCountSchema.parse(rawCurrentCount);
		const data = await getUnexportedNotes(currentCount);

		return {
			success: true,
			message: "success",
			data,
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
