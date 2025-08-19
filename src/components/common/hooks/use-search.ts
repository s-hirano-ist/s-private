"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";
import type { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import type { SearchQuery } from "@/domains/common/types/search-types";

const PARAM_NAME = "q";

type SearchableItem = {
	title: string;
};

type UseSearchableListOptions = {
	search: typeof searchContentFromClient;
	useUrlQuery?: boolean;
	debounceMs?: number;
};

type UseSearchableListReturn = {
	searchQuery: string;
	searchResults: SearchableItem[] | undefined;
	handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
	isPending: boolean;
};

export function useSearch({
	search,
	useUrlQuery = false,
	debounceMs = 300,
}: UseSearchableListOptions): UseSearchableListReturn {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Initialize search query from URL if useUrlQuery is enabled
	const initialQuery = useUrlQuery ? (searchParams.get(PARAM_NAME) ?? "") : "";
	const [searchQuery, setSearchQuery] = useState(initialQuery);
	const [searchResults, setSearchResults] = useState<SearchableItem[]>();

	const [isPending, startTransition] = useTransition();

	const fetchSearchResults = useCallback(
		async (searchQuery: string) => {
			if (searchQuery === "") setSearchResults(undefined);
			else {
				startTransition(async () => {
					const query: SearchQuery = {
						query: searchQuery.trim(),
						limit: 50,
					};
					const result = await search(query);
					if (result.success && result.data) {
						const newData = result.data.results.map((d) => {
							return { title: d.title };
						});
						setSearchResults(newData);
					}
				});
			}
		},
		[search],
	);

	const debouncedSearch = useDebouncedCallback(async (searchString: string) => {
		if (useUrlQuery) {
			const params = new URLSearchParams(searchParams);
			if (searchString) params.set(PARAM_NAME, searchString);
			else params.delete(PARAM_NAME);
			router.push(`?${params.toString()}`);
		}

		await fetchSearchResults(searchString);
	}, debounceMs);

	const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const query = e.target.value;
		setSearchQuery(query);
		await debouncedSearch(query);
	};

	return {
		searchQuery,
		searchResults,
		handleSearchChange,
		isPending,
	};
}
