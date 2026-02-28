"use client";
import { ProfilerWrapper } from "@s-hirano-ist/s-ui/dev/profiler-wrapper";
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
 * Props passed to the children function.
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
	children: (props: RenderCardProps<T>) => React.ReactNode;
	gridClassName: string;
};

export function BaseCardStackWrapper<T extends SearchableItem>({
	initial,
	deleteAction,
	loadMoreAction,
	children,
	gridClassName,
}: BaseCardStackProps<T>) {
	const [isPending, startTransition] = useTransition();
	const [allData, setAllData] = useState(initial.data);
	const [totalCount, setTotalCount] = useState(initial.totalCount);
	const [prevInitialData, setPrevInitialData] = useState(initial.data);

	if (prevInitialData !== initial.data) {
		setPrevInitialData(initial.data);
		setAllData(initial.data);
		setTotalCount(initial.totalCount);
	}

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
		<ProfilerWrapper
			enabled={process.env.NODE_ENV === "development"}
			id="BaseCardStack"
		>
			<div className="px-2 py-4">
				{allData.length === 0 ? (
					<StatusCodeView statusCode="204" statusCodeString={t("204")} />
				) : (
					<div className={gridClassName}>
						{allData.map((item, index) => {
							const isLast = index === allData.length - 1;
							const itemKey = "key" in item ? item.key : item.id;
							return (
								<div
									className="animate-[card-enter_200ms_ease-out_both]"
									key={itemKey}
									style={{
										contentVisibility: "auto",
										containIntrinsicSize: "auto 200px",
										animationDelay: `${Math.min(index * 30, 300)}ms`,
									}}
								>
									{children({
										item,
										index,
										isLast,
										lastElementRef,
										deleteAction,
										itemKey,
									})}
								</div>
							);
						})}
					</div>
				)}
				{isPending && <Loading />}
			</div>
		</ProfilerWrapper>
	);
}
