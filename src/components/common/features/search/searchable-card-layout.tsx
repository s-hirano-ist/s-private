"use client";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Input } from "@/components/common/ui/input";
import { StatusCodeView } from "../../display/status/status-code-view";

type SearchableCardLayoutProps<T> = {
	searchQuery: string;
	searchResults: T[];
	handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
	renderCard: (item: T, index: number) => ReactNode;
	gridClassName: string;
};

export function SearchableCardLayout<T>({
	searchQuery,
	searchResults,
	handleSearchChange,
	renderCard,
	gridClassName,
}: SearchableCardLayoutProps<T>) {
	const t = useTranslations("label");

	return (
		<div className="px-2 sm:px-4">
			<Input
				className="my-4"
				onChange={handleSearchChange}
				placeholder={t("search")}
				type="search"
				value={searchQuery}
			/>
			{searchResults.length === 0 ? (
				<StatusCodeView statusCode="204" />
			) : (
				<div className={gridClassName}>
					{searchResults.map((item, index) => renderCard(item, index))}
				</div>
			)}
		</div>
	);
}
