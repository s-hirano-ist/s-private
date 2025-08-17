"use client";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { ServerAction, ServerActionWithData } from "@/common/types";
import { StatusCodeView } from "@/components/common/display/status/status-code-view";
import { useInfiniteScroll } from "@/components/common/hooks/use-infinite-scroll";
import { useSearchableList } from "@/components/common/hooks/use-searchable-list";
import { Input } from "@/components/common/ui/input";
import Loading from "../../display/loading";

export type CardStackInitialData<T> = {
	data: T[];
	totalCount: number;
};

type SearchableItem = {
	title: string;
};

type BaseCardStackProps<T extends SearchableItem> = {
	initial: CardStackInitialData<T>;
	deleteAction?: (id: string) => Promise<ServerAction>;
	loadMoreAction: (
		currentCount: number,
	) => Promise<ServerActionWithData<CardStackInitialData<T>>>;
	filterFunction: (item: T, searchQuery: string) => boolean;
	renderCard: (
		item: T,
		index: number,
		isLast: boolean,
		isSearching: boolean,
		lastElementRef: (node: HTMLElement | null) => void,
		deleteAction?: (id: string) => Promise<ServerAction>,
	) => React.ReactNode;
	gridClassName: string;
};

export function BaseCardStackWrapper<T extends SearchableItem>({
	initial,
	deleteAction,
	loadMoreAction,
	filterFunction,
	renderCard,
	gridClassName,
}: BaseCardStackProps<T>) {
	const t = useTranslations("label");

	const [isPending, startTransition] = useTransition();
	const [allData, setAllData] = useState(initial.data);
	const [totalCount, setTotalCount] = useState(initial.totalCount);
	const hasNextPage = allData.length < totalCount;

	const handleLoadMore = async () => {
		if (!hasNextPage) return;
		startTransition(async () => {
			const result = await loadMoreAction(allData.length);
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

	const { searchQuery, searchResults, handleSearchChange } = useSearchableList({
		data: allData,
		filterFunction,
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
				<div className={gridClassName}>
					{dataToShow.map((item, index) => {
						const isLast = index === dataToShow.length - 1;
						return renderCard(
							item,
							index,
							isLast,
							isSearching,
							lastElementRef,
							deleteAction,
						);
					})}
				</div>
			)}
			{isPending && !isSearching && <Loading />}
		</div>
	);
}
