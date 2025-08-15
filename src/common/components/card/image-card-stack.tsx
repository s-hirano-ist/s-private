"use client";
import { ImageCard, ImageCardData } from "@/common/components/card/image-card";
import { SearchableCardLayout } from "@/common/components/search/searchable-card-layout";
import { useSearchableList } from "@/common/hooks/use-searchable-list";
import type { ServerAction } from "@/common/types";
import { filterImageCards } from "@/features/search/services/search-filter";

type Props = {
	basePath: string;
	data: ImageCardData[];
	showDeleteButton?: boolean;
	deleteAction?: (id: string) => Promise<ServerAction>;
};

export function ImageCardStack({
	data,
	basePath,
	showDeleteButton = false,
	deleteAction,
}: Props) {
	const { searchQuery, searchResults, handleSearchChange } = useSearchableList({
		data,
		filterFunction: filterImageCards,
	});

	return (
		<SearchableCardLayout
			gridClassName="my-2 grid grid-cols-2 items-stretch gap-4 sm:grid-cols-3 lg:grid-cols-4"
			handleSearchChange={handleSearchChange}
			renderCard={(searchResult) => (
				<ImageCard
					basePath={basePath}
					data={searchResult}
					deleteAction={deleteAction}
					key={searchResult.id}
					showDeleteButton={showDeleteButton}
				/>
			)}
			searchQuery={searchQuery}
			searchResults={searchResults}
		/>
	);
}
