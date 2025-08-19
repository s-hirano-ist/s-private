"use server";
import "server-only";
import { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import type { SearchQuery } from "@/domains/common/types/search-types";

export async function search(searchQuery: string) {
	const query: SearchQuery = {
		query: searchQuery.trim(),
		limit: 50,
	};

	return await searchContentFromClient(query);
}
