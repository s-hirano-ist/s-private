"use server";
import "server-only";
import type { UnifiedSearchResults } from "@s-hirano-ist/s-core/shared-kernel/types/search-types";
import { searchQuerySchema } from "@s-hirano-ist/s-core/shared-kernel/types/search-types";
import { forbidden } from "next/navigation";
import { getSelfId, hasViewerAdminPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerActionWithData } from "@/common/types";
import { searchContent } from "./search-content";

export async function searchContentFromClient(
	rawSearchQuery: unknown,
): Promise<ServerActionWithData<UnifiedSearchResults>> {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const searchQuery = searchQuerySchema.parse(rawSearchQuery);
		const userId = await getSelfId();

		const data = await searchContent(searchQuery, userId);

		return {
			success: true,
			message: "Search completed successfully",
			data,
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
