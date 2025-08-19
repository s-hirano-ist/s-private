"use client";
import { useTranslations } from "next-intl";
import { StatusCodeView } from "@/components/common/display/status/status-code-view";
import { useSearch } from "@/components/common/hooks/use-search";
import { Input } from "@/components/common/ui/input";
import Loading from "../../display/loading";
import type { search } from "./search-filter";

type Props = { search: typeof search };

export function SearchCard({ search }: Props) {
	const t = useTranslations("label");

	const { searchQuery, searchResults, handleSearchChange, isPending } =
		useSearch({ search });

	return (
		<div className="px-2 sm:px-4">
			<Input
				className="my-4"
				onChange={handleSearchChange}
				placeholder={t("search")}
				type="search"
				value={searchQuery}
			/>
			{searchResults?.length === 0 ? (
				<StatusCodeView statusCode="204" />
			) : (
				<div className="grid grid-cols-4">
					{searchResults?.map((item, index) => {
						return <div key={String(index)}>{item.title}</div>;
					})}
				</div>
			)}
			{isPending && <Loading />}
		</div>
	);
}
