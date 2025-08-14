"use client";
import { LinkCard, LinkCardData } from "@/components/card/link-card";
import { SearchableCardLayout } from "@/components/search/searchable-card-layout";
import { filterLinkCards } from "@/features/search/services/search-filter";
import { useSearchableList } from "@/utils/hooks/use-searchable-list";
import type { ServerAction } from "@/utils/types";

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
