"use client";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import { StatusCodeView } from "@/components/common/display/status/status-code-view";
import { useSearch } from "@/components/common/hooks/use-search";
import {
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/common/ui/command";
import Loading from "../../display/loading";

type Props = { search: typeof searchContentFromClient };

export function SearchCard({ search }: Props) {
	const t = useTranslations("label");
	const router = useRouter();
	const locale = useLocale();

	const { searchQuery, searchResults, handleSearchChange, isPending } =
		useSearch({ search, useUrlQuery: true });

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

	return (
		<>
			<CommandInput
				onValueChange={handleInputChange}
				placeholder={t("search")}
				value={searchQuery}
			/>
			<CommandList>
				{searchResults === undefined ||
				(searchResults?.length === 0 && searchQuery && !isPending) ? (
					<CommandEmpty>
						<div className="flex items-center justify-center">
							<StatusCodeView statusCode="204" />
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
