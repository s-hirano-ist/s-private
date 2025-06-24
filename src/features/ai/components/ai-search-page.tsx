"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { SearchResult } from "@/features/ai/actions/ai-search";
import { searchKnowledge } from "@/features/ai/actions/ai-search";
import { SearchForm } from "@/features/ai/components/search-form";
import { SearchResults } from "@/features/ai/components/search-results";

export function AiSearchPage() {
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

	return (
		<div className="container mx-auto max-w-4xl py-8">
			<div className="mb-8">
				<h1 className="mb-4 text-3xl font-bold">{t("aiSearch")}</h1>
				<p className="text-muted-foreground">{t("aiSearchDescription")}</p>
			</div>

			<SearchForm initialQuery={initialQuery} onSearch={handleSearch} />
			<SearchResults isLoading={isSearching} results={results} />
		</div>
	);
}
