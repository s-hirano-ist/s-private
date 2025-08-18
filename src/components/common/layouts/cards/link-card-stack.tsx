"use client";
import type { ServerAction, ServerActionWithData } from "@/common/types";
import { filterLinkCards } from "@/components/common/features/search/search-filter";
import { BaseCardStackWrapper } from "@/components/common/layouts/cards/base-card-stack";
import { LinkCard } from "@/components/common/layouts/cards/link-card";
import type { LinkCardData, LinkCardStackInitialData } from "./types";

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
	const showDeleteButton = deleteAction !== undefined;

	const renderCard = (
		item: LinkCardData,
		_index: number,
		isLast: boolean,
		isSearching: boolean,
		lastElementRef: (node: HTMLElement | null) => void,
		deleteAction?: (id: string) => Promise<ServerAction>,
		key?: string,
	) => (
		<div
			className="h-full"
			key={key}
			ref={isLast && !isSearching ? lastElementRef : null}
		>
			<LinkCard
				data={item}
				deleteAction={deleteAction}
				showDeleteButton={showDeleteButton}
			/>
		</div>
	);

	return (
		<BaseCardStackWrapper
			deleteAction={deleteAction}
			filterFunction={filterLinkCards}
			gridClassName="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2 sm:gap-4"
			initial={initial}
			loadMoreAction={loadMoreAction}
			renderCard={renderCard}
		/>
	);
}
