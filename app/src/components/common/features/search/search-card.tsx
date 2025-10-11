"use client";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback } from "react";
import Loading from "s-private-components/display/loading";
import { StatusCodeView } from "s-private-components/display/status/status-code-view";
import {
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from "s-private-components/ui/command";
import type { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import { useSearch } from "@/components/common/hooks/use-search";
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
	} = useSearch({ search, useUrlQuery: true });

	const handleInputChange = (value: string) => {
		const event = { target: { value } } as React.ChangeEvent<HTMLInputElement>;
		handleSearchChange(event);
	};

	const handleSelect = (item: {
		href: string;
		contentType: "articles" | "books" | "notes";
		url?: string;
	}) => {
		if (item.contentType === "articles" && item.url) {
			window.open(item.url, "_blank");
		} else if (item.contentType === "books") {
			router.push(`/${locale}/book/${item.href}`);
		} else if (item.contentType === "notes") {
			router.push(`/${locale}/note/${item.href}`);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
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
			<div className="w-full">
				<CommandInput
					onKeyDown={handleKeyDown}
					onSearchClick={executeSearch}
					onValueChange={handleInputChange}
					placeholder={t("search")}
					value={searchQuery}
				/>
			</div>
			<CommandList>
				{searchResults === undefined ? (
					<UtilButtons
						handleReload={handleReload}
						onSignOutSubmit={onSignOutSubmit}
					/>
				) : searchResults?.length === 0 && searchQuery && !isPending ? (
					<CommandEmpty>
						<div className="flex items-center justify-center">
							<StatusCodeView
								statusCode="204"
								statusCodeString={statusCodes("204")}
							/>
						</div>
					</CommandEmpty>
				) : isPending ? (
					<div className="p-4">
						<Loading />
					</div>
				) : (
					searchResults?.map((item, index) => (
						<CommandItem
							key={String(index)}
							onSelect={() => handleSelect(item)}
						>
							{item.title}
						</CommandItem>
					))
				)}
			</CommandList>
		</>
	);
}
