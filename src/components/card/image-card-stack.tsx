"use client";
import { ImageCard, ImageCardData } from "@/components/card/image-card";
import { SearchableCardLayout } from "@/components/search/searchable-card-layout";
import { filterImageCards } from "@/features/search/services/search-filter";
import { useSearchableList } from "@/utils/hooks/use-searchable-list";

type Props = {
	basePath: string;
	data: ImageCardData[];
};

export function ImageCardStack({ data, basePath }: Props) {
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
					key={searchResult.title}
				/>
			)}
			searchQuery={searchQuery}
			searchResults={searchResults}
		/>
	);
}
