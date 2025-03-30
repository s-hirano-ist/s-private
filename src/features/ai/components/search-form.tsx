"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";

type Props = {
	initialQuery?: string;
	onSearch: (query: string) => void;
};

export function SearchForm({ initialQuery = "", onSearch }: Props) {
	const [query, setQuery] = useState(initialQuery);
	const [isSearching, setIsSearching] = useState(false);
	const router = useRouter();
	const t = useTranslations("label");

	const debouncedSearch = useDebouncedCallback((searchQuery: string) => {
		if (searchQuery.trim()) {
			const params = new URLSearchParams();
			params.set("q", searchQuery);
			router.push(`?${params.toString()}`);
			onSearch(searchQuery);
		}
	}, 300);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setIsSearching(true);

		try {
			if (query.trim()) {
				const params = new URLSearchParams();
				params.set("q", query);
				router.push(`?${params.toString()}`);
				onSearch(query);
			}
		} finally {
			setIsSearching(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newQuery = e.target.value;
		setQuery(newQuery);

		const trimmedQuery = newQuery.trim();
		if (trimmedQuery) {
			debouncedSearch(newQuery);
		} else {
			// Clear search results if query is empty
			router.push("?");
			onSearch("");
		}
	};

	return (
		<form className="flex w-full gap-2" onSubmit={handleSubmit}>
			<Input
				className="flex-1"
				onChange={handleChange}
				placeholder={t("search")}
				type="search"
				value={query}
			/>
			<Button disabled={isSearching || !query.trim()} type="submit">
				{t("search")}
			</Button>
		</form>
	);
}
