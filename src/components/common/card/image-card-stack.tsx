"use client";
import type { ServerAction } from "@/common/types";
import { ImageCard, ImageCardData } from "@/components/common/card/image-card";
import { useSearchableList } from "@/components/common/hooks/use-searchable-list";
import { filterImageCards } from "@/components/common/search/search-filter";
import { SearchableCardLayout } from "@/components/common/search/searchable-card-layout";

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
