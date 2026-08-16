"use client";

import type { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import type { SearchQuery } from "@s-hirano-ist/s-core/shared-kernel/types/search-types";
import { useRef, useState, useTransition } from "react";

type SearchableItem = {
	category?: string;
	contentType: "articles" | "books" | "notes";
	href: string;
	snippet?: string;
	title: string;
	url?: string;
};

type UseSearchableListOptions = {
	search: typeof searchContentFromClient;
};

type UseSearchableListReturn = {
	executeSearch: () => Promise<void>;
	handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	isError: boolean;
	isPending: boolean;
	searchQuery: string;
	searchResults: SearchableItem[] | undefined;
};

export function useSearch({
	search,
}: UseSearchableListOptions): UseSearchableListReturn {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<SearchableItem[]>();
	const [isError, setIsError] = useState(false);

	const [isPending, startTransition] = useTransition();
	const abortControllerRef = useRef<AbortController | null>(null);

	const fetchSearchResults = async (queryText: string) => {
		abortControllerRef.current?.abort();

		if (queryText === "") {
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
					query: queryText.trim(),
					limit: 50,
				};
				const result = await search(query);

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
	};

	const executeSearch = async () => {
		if (isPending) return;
		await fetchSearchResults(searchQuery);
	};

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
