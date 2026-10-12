"use server";
import "server-only";
import type { ServerActionWithData } from "@/common/types";
import { searchContent } from "@/application-services/search/search-content";
import { backendActionError } from "@/common/backend/action-error";
import { SearchContentParams } from "@s-hirano-ist/s-api-client/models";

export async function searchContentFromClient(
	rawSearchQuery: unknown,
): Promise<ServerActionWithData<Awaited<ReturnType<typeof searchContent>>>> {
	try {
		const query = SearchContentParams.safeParse(rawSearchQuery);
		if (!query.success) return { success: false, message: "invalidFormat" };
		const data = await searchContent(query.data);
		return { success: true, message: "Search completed successfully", data };
	} catch (error) {
		return backendActionError(error);
	}
}
