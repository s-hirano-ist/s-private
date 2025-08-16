"use client";
import { filterLinkCards } from "@/applications/search/search-filter";
import { LinkCard, LinkCardData } from "@/common/components/card/link-card";
import { SearchableCardLayout } from "@/common/components/search/searchable-card-layout";
import { useSearchableList } from "@/common/hooks/use-searchable-list";
import type { ServerAction } from "@/common/types";

type Props = {
	data: LinkCardData[];
	showDeleteButton: boolean;
	deleteAction?: (id: string) => Promise<ServerAction>;
};

export function LinkCardStack({ data, showDeleteButton, deleteAction }: Props) {
	const { searchQuery, searchResults, handleSearchChange } = useSearchableList({
		data,
		filterFunction: filterLinkCards,
	});

	return (
		<SearchableCardLayout
			gridClassName="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4"
			handleSearchChange={handleSearchChange}
			renderCard={(item) => (
				<LinkCard
					data={item}
					deleteAction={deleteAction}
					key={item.key}
					showDeleteButton={showDeleteButton}
				/>
			)}
			searchQuery={searchQuery}
			searchResults={searchResults}
		/>
	);
}
