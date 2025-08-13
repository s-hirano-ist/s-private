"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { LinkCard } from "@/components/card/link-card";
import Loading from "@/components/loading";
import { StatusCodeView } from "@/components/status/status-code-view";
import { Input } from "@/components/ui/input";
import type { SearchResult } from "@/features/ai/actions/ai-search";

type Props = {
	searchKnowledge: (query: string) => Promise<SearchResult[]>;
};

export function SimpleSearch({ searchKnowledge }: Props) {
	const searchParams = useSearchParams();
	const initialQuery = searchParams.get("q") || "";
	const [results, setResults] = useState<SearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const t = useTranslations("label");

	// Perform search when the component mounts if there's an initial query
	useEffect(() => {
		if (initialQuery) {
			handleSearch(initialQuery);
		}
		// eslint-disable-next-line
	}, [initialQuery]);

	const handleSearch = async (query: string) => {
		if (!query.trim()) {
			setResults([]);
			return;
		}

		setIsSearching(true);
		try {
			const searchResults = await searchKnowledge(query);
			setResults(searchResults);
		} catch (error) {
			console.error("Error searching:", error);
		} finally {
			setIsSearching(false);
		}
	};

	const [searchQuery, setSearchQuery] = useState(initialQuery);
	const router = useRouter();

	const debouncedSearch = useDebouncedCallback((searchQuery: string) => {
		if (searchQuery.trim()) {
			const params = new URLSearchParams();
			params.set("q", searchQuery);
			router.push(`?${params.toString()}`);
			handleSearch(searchQuery);
		}
	}, 300);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newQuery = e.target.value;
		setSearchQuery(newQuery);

		const trimmedQuery = newQuery.trim();
		if (trimmedQuery) {
			debouncedSearch(newQuery);
		} else {
			// Clear search results if query is empty
			router.push("?");
			handleSearch("");
		}
	};

	if (isSearching) return <Loading />;

	return (
		<div className="p-2 sm:p-4">
			<div className="p-2 sm:p-4">
				<Input
					className="my-4"
					onChange={handleSearchChange}
					placeholder={t("search")}
					type="search"
					value={searchQuery}
				/>
			</div>
			<div className="mt-4 space-y-4">
				{results.length === 0 ? (
					<StatusCodeView statusCode="204" />
				) : (
					<div className="">
						{results.map((result) => {
							return (
								<LinkCard
									data={result}
									key={result.id}
									showDeleteButton={false}
								/>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
