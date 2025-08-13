"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

const PARAM_NAME = "q";

type SearchableItem = {
	title: string;
};

type UseSearchableListOptions<T extends SearchableItem> = {
	data: T[];
	filterFunction?: (item: T, searchQuery: string) => boolean;
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
	debounceMs = 300,
}: UseSearchableListOptions<T>): UseSearchableListReturn<T> {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [searchQuery, setSearchQuery] = useState(
		searchParams.get(PARAM_NAME) ?? "",
	);
	const [searchResults, setSearchResults] = useState(data);

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
		const params = new URLSearchParams(searchParams);
		if (searchString) params.set(PARAM_NAME, searchString);
		else params.delete(PARAM_NAME);

		router.push(`?${params.toString()}`);
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
	};
}
