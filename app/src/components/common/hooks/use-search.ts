"use client";

import type { SearchQuery } from "@s-hirano-ist/s-core/shared-kernel/types/search-types";
import { useCallback, useRef, useState, useTransition } from "react";
import type { searchContentFromClient } from "@/application-services/search/search-content-from-client";

type SearchableItem = {
	href: string;
	contentType: "articles" | "books" | "notes";
	title: string;
	url?: string;
	snippet?: string;
	category?: string;
};

type UseSearchableListOptions = {
	search: typeof searchContentFromClient;
};

type UseSearchableListReturn = {
	searchQuery: string;
	searchResults: SearchableItem[] | undefined;
	handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	executeSearch: () => Promise<void>;
	isPending: boolean;
	isError: boolean;
};

export function useSearch({
	search,
}: UseSearchableListOptions): UseSearchableListReturn {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<SearchableItem[]>();
	const [isError, setIsError] = useState(false);

	const [isPending, startTransition] = useTransition();
	const abortControllerRef = useRef<AbortController | null>(null);

	const fetchSearchResults = useCallback(
		async (searchQuery: string) => {
			abortControllerRef.current?.abort();

			if (searchQuery === "") {
				setSearchResults(undefined);
				setIsError(false);
				return;
			}

			const controller = new AbortController();
			abortControllerRef.current = controller;

			startTransition(async () => {
				try {
					setIsError(false);
					const query: SearchQuery = {
						query: searchQuery.trim(),
						limit: 50,
					};
					console.log("[Search] query:", query);
					const result = await search(query);
					console.log("[Search] result:", result);

					if (controller.signal.aborted) return;

					if (result.success && result.data) {
						const newData = result.data.results.map((d) => ({
							href: d.href,
							contentType: d.contentType,
							title: d.title,
							url: d.contentType === "articles" ? d.url : undefined,
							snippet: d.snippet,
							category:
								d.contentType === "articles" ? d.category.name : undefined,
						}));
						setSearchResults(newData);
					} else {
						setSearchResults([]);
						setIsError(true);
					}
				} catch {
					if (controller.signal.aborted) return;
					setSearchResults([]);
					setIsError(true);
				}
			});
		},
		[search],
	);

	const executeSearch = useCallback(async () => {
		if (isPending) return;
		await fetchSearchResults(searchQuery);
	}, [isPending, searchQuery, fetchSearchResults]);

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
		isError,
	};
}
