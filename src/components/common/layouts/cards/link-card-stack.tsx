"use client";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { deleteNews } from "@/application-services/news/delete-news";
import type { ServerAction, ServerActionWithData } from "@/common/types";
import { StatusCodeView } from "@/components/common/display/status/status-code-view";
import { filterLinkCards } from "@/components/common/features/search/search-filter";
import { useInfiniteScroll } from "@/components/common/hooks/use-infinite-scroll";
import { useSearchableList } from "@/components/common/hooks/use-searchable-list";
import {
	LinkCard,
	LinkCardData,
} from "@/components/common/layouts/cards/link-card";
import { Input } from "@/components/common/ui/input";
import Loading from "../../display/loading";

export type LinkCardStackInitialData = {
	data: LinkCardData[];
	totalCount: number;
};

type Props = {
	initial: LinkCardStackInitialData;
	deleteAction?: (id: string) => Promise<ServerAction>;
	loadMoreAction: (
		currentCount: number,
	) => Promise<ServerActionWithData<LinkCardStackInitialData>>;
};

export function LinkCardStack({
	initial,
	deleteAction,
	loadMoreAction,
}: Props) {
	const t = useTranslations("label");
	const showDeleteButton = deleteNews !== undefined;

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
		filterFunction: filterLinkCards,
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
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
					{dataToShow.map((item, index) => {
						const isLast = index === dataToShow.length - 1;
						return (
							<div
								key={item.key}
								ref={isLast && !isSearching ? lastElementRef : null}
							>
								<LinkCard
									data={item}
									deleteAction={deleteAction}
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
