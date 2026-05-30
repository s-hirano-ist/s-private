"use server";
import "server-only";
import type { ServerActionWithData } from "@/common/types";
import type { UnifiedSearchResults } from "@s-hirano-ist/s-core/shared-kernel/types/search-types";
import { getSelfId, requireAuth } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import { searchQuerySchema } from "@s-hirano-ist/s-core/shared-kernel/types/search-types";
import { searchContent } from "./search-content";

export async function searchContentFromClient(
	rawSearchQuery: unknown,
): Promise<ServerActionWithData<UnifiedSearchResults>> {
	await requireAuth();

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
