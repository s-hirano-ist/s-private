"use client";
import type { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import { StatusCodeView } from "@/components/common/display/status/status-code-view";
import { useSearch } from "@/components/common/hooks/use-search";
import { LinkCard } from "@/components/common/layouts/cards/link-card";
import { Button } from "@s-hirano-ist/s-ui/button";
import { Input } from "@s-hirano-ist/s-ui/input";
import { LoadingIndicator as Loading } from "@s-hirano-ist/s-ui/loading-indicator";
import { haptic } from "@s-hirano-ist/s-ui/utils/haptic";
import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
	search: typeof searchContentFromClient;
};

type SearchResultCardData = {
	description: string;
	href: string;
	id: string;
	key: string;
	primaryBadgeText: string;
	secondaryBadgeText?: string;
	title: string;
};

export function SearchCard({ search }: Props) {
	const t = useTranslations("label");
	const statusCodes = useTranslations("statusCode");

	const {
		searchQuery,
		searchResults,
		handleSearchChange,
		executeSearch,
		isPending,
		isError,
	} = useSearch({ search });

	const getCardData = (
		item: NonNullable<typeof searchResults>[number],
	): SearchResultCardData => {
		switch (item.contentType) {
			case "articles":
				return {
					description: item.snippet,
					href: item.url || item.href,
					id: item.href,
					key: item.href,
					primaryBadgeText: t("article"),
					secondaryBadgeText: item.category,
					title: item.title,
				};
			case "books":
				return {
					description: item.snippet,
					href: `/book/${item.href}`,
					id: item.href,
					key: item.href,
					primaryBadgeText: t("book"),
					title: item.title,
				};
			case "notes":
				return {
					description: item.snippet,
					href: `/note/${item.href}`,
					id: item.href,
					key: item.href,
					primaryBadgeText: t("note"),
					title: item.title,
				};
			default:
				throw new Error("Unsupported search result type");
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !isPending) {
			void executeSearch();
		}
	};

	let content: React.ReactNode;
	if (isPending) {
		content = (
			<div className="p-4">
				<Loading />
			</div>
		);
	} else if (searchResults === undefined) {
		content = (
			<div className="flex items-center justify-center">
				<StatusCodeView
					statusCode="204"
					statusCodeString={statusCodes("204")}
				/>
			</div>
		);
	} else if (isError) {
		content = (
			<div className="flex items-center justify-center">
				<StatusCodeView
					statusCode="500"
					statusCodeString={statusCodes("500")}
				/>
			</div>
		);
	} else if (searchResults.length === 0 && searchQuery) {
		content = (
			<div className="flex items-center justify-center">
				<StatusCodeView
					statusCode="204"
					statusCodeString={statusCodes("204")}
				/>
			</div>
		);
	} else {
		content = (
			<div className="flex flex-col gap-2 p-2">
				{searchResults.map((item) => {
					const data = getCardData(item);
					return <LinkCard data={data} key={data.key} onClick={haptic} />;
				})}
			</div>
		);
	}

	return (
		<>
			<div className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
				<Input
					className="border-none shadow-none focus-visible:ring-0"
					onChange={handleSearchChange}
					onKeyDown={handleKeyDown}
					placeholder={t("search")}
					value={searchQuery}
				/>
				<Button
					aria-label={t("search")}
					className="shrink-0"
					disabled={isPending}
					onClick={executeSearch}
					size="icon"
				>
					<SearchIcon className="size-4" />
				</Button>
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto">{content}</div>
		</>
	);
}
