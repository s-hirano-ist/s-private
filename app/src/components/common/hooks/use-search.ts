"use client";

import type { SearchQuery } from "@s-hirano-ist/s-core/common/types/search-types";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import type { searchContentFromClient } from "@/application-services/search/search-content-from-client";

const PARAM_NAME = "q";

type SearchableItem = {
	href: string;
	contentType: "articles" | "books" | "notes";
	title: string;
	url?: string;
};

type UseSearchableListOptions = {
	search: typeof searchContentFromClient;
	useUrlQuery?: boolean;
};

type UseSearchableListReturn = {
	searchQuery: string;
	searchResults: SearchableItem[] | undefined;
	handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	executeSearch: () => Promise<void>;
	isPending: boolean;
};

export function useSearch({
	search,
	useUrlQuery = false,
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
							return {
								href: d.href,
								contentType: d.contentType,
								title: d.title,
								url: d.url,
							};
						});
						setSearchResults(newData);
					}
				});
			}
		},
		[search],
	);

	const executeSearch = useCallback(async () => {
		if (useUrlQuery) {
			const params = new URLSearchParams(searchParams);
			if (searchQuery) params.set(PARAM_NAME, searchQuery);
			else params.delete(PARAM_NAME);
			router.push(`?${params.toString()}`);
		}

		await fetchSearchResults(searchQuery);
	}, [useUrlQuery, searchParams, searchQuery, router, fetchSearchResults]);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const query = e.target.value;
		setSearchQuery(query);
	};

	return {
		searchQuery,
		searchResults,
		handleSearchChange,
		executeSearch,
		isPending,
	};
}
