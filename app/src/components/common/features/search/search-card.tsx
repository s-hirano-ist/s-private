"use client";
import Loading from "@s-hirano-ist/s-ui/display/loading";
import { StatusCodeView } from "@s-hirano-ist/s-ui/display/status/status-code-view";
import { Button } from "@s-hirano-ist/s-ui/ui/button";
import { Input } from "@s-hirano-ist/s-ui/ui/input";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import type { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import { useSearch } from "@/components/common/hooks/use-search";
import { LinkCard } from "../../layouts/cards/link-card";
import { UtilButtons } from "../../layouts/nav/util-buttons";

type Props = { search: typeof searchContentFromClient };

export function SearchCard({ search }: Props) {
	const t = useTranslations("label");
	const statusCodes = useTranslations("statusCode");

	const router = useRouter();
	const locale = useLocale();

	const {
		searchQuery,
		searchResults,
		handleSearchChange,
		executeSearch,
		isPending,
		isError,
	} = useSearch({ search });

	const { articles, nonArticles } = useMemo(() => {
		if (!searchResults) return { articles: [], nonArticles: [] };
		return {
			articles: searchResults.filter((r) => r.contentType === "articles"),
			nonArticles: searchResults.filter((r) => r.contentType !== "articles"),
		};
	}, [searchResults]);

	const handleSelect = (item: {
		href: string;
		contentType: "articles" | "books" | "notes";
	}) => {
		if (item.contentType === "books") {
			router.push(`/${locale}/book/${item.href}`);
		} else if (item.contentType === "notes") {
			router.push(`/${locale}/note/${item.href}`);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !isPending) {
			executeSearch();
		}
	};
	const handleReload = useCallback(() => {
		window.location.reload();
	}, []);

	const onSignOutSubmit = useCallback(async () => {
		await signOut();
	}, []);

	return (
		<>
			<div className="flex h-12 items-center gap-2 border-b px-4">
				<Input
					className="border-none shadow-none focus-visible:ring-0"
					onChange={handleSearchChange}
					onKeyDown={handleKeyDown}
					placeholder={t("search")}
					value={searchQuery}
				/>
				<Button
					className="shrink-0"
					disabled={isPending}
					onClick={executeSearch}
					size="icon"
				>
					<SearchIcon className="size-4" />
				</Button>
			</div>
			<div className="h-[300px] overflow-y-auto">
				{searchResults === undefined ? (
					<UtilButtons
						handleReload={handleReload}
						onSignOutSubmit={onSignOutSubmit}
					/>
				) : isError ? (
					<div className="flex items-center justify-center">
						<StatusCodeView
							statusCode="500"
							statusCodeString={statusCodes("500")}
						/>
					</div>
				) : searchResults?.length === 0 && searchQuery && !isPending ? (
					<div className="flex items-center justify-center">
						<StatusCodeView
							statusCode="204"
							statusCodeString={statusCodes("204")}
						/>
					</div>
				) : isPending ? (
					<div className="p-4">
						<Loading />
					</div>
				) : (
					nonArticles.map((item, index) => (
						<button
							className="w-full cursor-pointer rounded-sm px-2 py-3 text-left text-sm hover:bg-muted"
							key={String(index)}
							onClick={() => handleSelect(item)}
							type="button"
						>
							{item.title}
						</button>
					))
				)}
			</div>
			{articles.length > 0 && (
				<div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2">
					{articles.map((item, index) => (
						<LinkCard
							data={{
								id: String(index),
								key: item.url ?? item.href,
								title: item.title,
								description: item.snippet,
								primaryBadgeText: item.category,
								href: item.url ?? item.href,
							}}
							key={String(index)}
						/>
					))}
				</div>
			)}
		</>
	);
}
