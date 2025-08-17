"use client";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { ServerAction, ServerActionWithData } from "@/common/types";
import { filterImageCards } from "@/components/common/features/search/search-filter";
import { useSearchableList } from "@/components/common/hooks/use-searchable-list";
import {
	ImageCard,
	ImageCardData,
} from "@/components/common/layouts/cards/image-card";
import Loading from "../../display/loading";
import { StatusCodeView } from "../../display/status/status-code-view";
import { useInfiniteScroll } from "../../hooks/use-infinite-scroll";
import { Input } from "../../ui/input";

export type ImageCardStackInitialData = {
	data: ImageCardData[];
	totalCount: number;
};

type Props = {
	initial: ImageCardStackInitialData;
	basePath: string;
	deleteAction?: (id: string) => Promise<ServerAction>;
	loadMoreAction: (
		currentCount: number,
	) => Promise<ServerActionWithData<ImageCardStackInitialData>>;
};

export function ImageCardStack({
	initial,
	basePath,
	deleteAction,
	loadMoreAction,
}: Props) {
	const t = useTranslations("label");
	const showDeleteButton = deleteAction !== undefined;

	const [isPending, startTransition] = useTransition();
	const [allData, setAllData] = useState(initial.data);
	const [totalCount, setTotalCount] = useState(initial.totalCount);
	const hasNextPage = allData.length < totalCount;

	const handleLoadMore = async () => {
		if (!hasNextPage) return;
		startTransition(async () => {
			const result = await loadMoreAction(allData.length + 1);
			if (result.success && result.data) {
				const { data: newData, totalCount } = result.data;
				setTotalCount(totalCount);
				setAllData((prev) => [...prev, ...newData]);
			}
		});
	};

	const { lastElementRef } = useInfiniteScroll({
		hasNextPage: hasNextPage,
		isFetchingNextPage: isPending,
		fetchNextPage: handleLoadMore,
	});

	// Show filtered results or all data when no search
	const { searchQuery, searchResults, handleSearchChange } = useSearchableList({
		data: allData,
		filterFunction: filterImageCards,
	});

	const dataToShow = searchResults;
	const isSearching = searchQuery.length > 0;

	return (
		<div className="px-2 sm:px-4">
			<Input
				className="my-4"
				onChange={handleSearchChange}
				placeholder={t("search")}
				type="search"
				value={searchQuery}
			/>
			{dataToShow.length === 0 ? (
				<StatusCodeView statusCode="204" />
			) : (
				<div className="my-2 grid grid-cols-2 items-stretch gap-4 sm:grid-cols-3 lg:grid-cols-4">
					{dataToShow.map((item, index) => {
						const isLast = index === dataToShow.length - 1;
						return (
							<div
								key={item.id}
								ref={isLast && !isSearching ? lastElementRef : null}
							>
								<ImageCard
									basePath={basePath}
									data={item}
									deleteAction={deleteAction}
									key={item.id}
									showDeleteButton={showDeleteButton}
								/>
							</div>
						);
					})}
				</div>
			)}
			{isPending && !isSearching && <Loading />}
		</div>
	);
}
