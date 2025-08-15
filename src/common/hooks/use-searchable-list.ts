"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

const PARAM_NAME = "q";

type SearchableItem = {
	title: string;
};

type UseSearchableListOptions<T extends SearchableItem> = {
	data: T[];
	filterFunction: (item: T, searchQuery: string) => boolean;
	useUrlQuery?: boolean;
	debounceMs?: number;
};

type UseSearchableListReturn<T> = {
	searchQuery: string;
	searchResults: T[];
	handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
};

export function useSearchableList<T extends SearchableItem>({
	data,
	filterFunction = (item, searchQuery) => item.title.includes(searchQuery),
	useUrlQuery = false,
	debounceMs = 300,
}: UseSearchableListOptions<T>): UseSearchableListReturn<T> {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Initialize search query from URL if useUrlQuery is enabled
	const initialQuery = useUrlQuery ? (searchParams.get(PARAM_NAME) ?? "") : "";
	const [searchQuery, setSearchQuery] = useState(initialQuery);
	const [searchResults, setSearchResults] = useState<T[]>(data);

	// Sync search (filter existing data)
	const fetchSearchResults = useCallback(
		async (searchString: string) => {
			if (searchString === "") setSearchResults(data);
			else
				setSearchResults(
					data.filter((item) => filterFunction(item, searchString)),
				);
		},
		[data, filterFunction],
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

	// Sync searchResults when data changes
	useEffect(() => {
		if (searchQuery === "") {
			setSearchResults(data);
		} else {
			setSearchResults(
				data.filter((item) => filterFunction(item, searchQuery)),
			);
		}
	}, [data, searchQuery, filterFunction]);

	return {
		searchQuery,
		searchResults,
		handleSearchChange,
	};
}
