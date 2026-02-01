"use client";
import Loading from "@s-hirano-ist/s-ui/display/loading";
import { StatusCodeView } from "@s-hirano-ist/s-ui/display/status/status-code-view";
import { useInfiniteScroll } from "@s-hirano-ist/s-ui/hooks/use-infinite-scroll";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { DeleteAction, LoadMoreAction } from "@/common/types";
import type { CardStackInitialData } from "./types";

type SearchableItem = {
	title: string;
} & ({ key: string } | { id: string });

/**
 * Props passed to the renderCard function.
 */
export type RenderCardProps<T> = {
	item: T;
	index: number;
	isLast: boolean;
	lastElementRef: (node: HTMLElement | null) => void;
	deleteAction?: DeleteAction;
	itemKey: string;
};

type BaseCardStackProps<T extends SearchableItem> = {
	initial: CardStackInitialData<T>;
	deleteAction?: DeleteAction;
	loadMoreAction: LoadMoreAction<CardStackInitialData<T>>;
	renderCard: (props: RenderCardProps<T>) => React.ReactNode;
	gridClassName: string;
};

export function BaseCardStackWrapper<T extends SearchableItem>({
	initial,
	deleteAction,
	loadMoreAction,
	renderCard,
	gridClassName,
}: BaseCardStackProps<T>) {
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
				setAllData((prev) => {
					const existingKeys = new Set(
						prev.map((item) => ("key" in item ? item.key : item.id)),
					);
					const uniqueNewData = newData.filter((item) => {
						const itemKey = "key" in item ? item.key : item.id;
						return !existingKeys.has(itemKey);
					});
					return [...prev, ...uniqueNewData];
				});
			}
		});
	};

	const { lastElementRef } = useInfiniteScroll({
		hasNextPage: hasNextPage,
		isFetchingNextPage: isPending,
		fetchNextPage: handleLoadMore,
	});

	const t = useTranslations("statusCode");

	return (
		<div className="px-2 py-4">
			{allData.length === 0 ? (
				<StatusCodeView statusCode="204" statusCodeString={t("204")} />
			) : (
				<div className={gridClassName}>
					{allData.map((item, index) => {
						const isLast = index === allData.length - 1;
						const itemKey = "key" in item ? item.key : item.id;
						return renderCard({
							item,
							index,
							isLast,
							lastElementRef,
							deleteAction,
							itemKey,
						});
					})}
				</div>
			)}
			{isPending && <Loading />}
		</div>
	);
}
