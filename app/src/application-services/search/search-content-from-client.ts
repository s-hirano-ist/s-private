"use server";
import "server-only";
import { forbidden } from "next/navigation";
import type {
	SearchQuery,
	UnifiedSearchResults,
} from "s-private-domains/common/types/search-types";
import { getSelfId, hasViewerAdminPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerActionWithData } from "@/common/types";
import { searchContent } from "./search-content";

export async function searchContentFromClient(
	searchQuery: SearchQuery,
): Promise<ServerActionWithData<UnifiedSearchResults>> {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
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
