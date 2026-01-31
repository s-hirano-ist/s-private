"use client";
import type { DeleteAction, LoadMoreAction } from "@/common/types";
import { DeleteButtonWithModal } from "@/components/common/forms/actions/delete-button-with-modal";
import { BaseCardStackWrapper } from "@/components/common/layouts/cards/base-card-stack";
import { LinkCard } from "@/components/common/layouts/cards/link-card";
import type { LinkCardData, LinkCardStackInitialData } from "./types";

type Props = {
	initial: LinkCardStackInitialData;
	deleteAction?: DeleteAction;
	loadMoreAction: LoadMoreAction<LinkCardStackInitialData>;
};

export function LinkCardStack({
	initial,
	deleteAction,
	loadMoreAction,
}: Props) {
	const renderCard = (
		item: LinkCardData,
		_index: number,
		isLast: boolean,
		lastElementRef: (node: HTMLElement | null) => void,
		deleteAction?: DeleteAction,
		key?: string,
	) => (
		<div className="h-full" key={key} ref={isLast ? lastElementRef : null}>
			<LinkCard
				actions={
					deleteAction !== undefined ? (
						<DeleteButtonWithModal
							deleteAction={deleteAction}
							id={item.id}
							title={item.title}
						/>
					) : undefined
				}
				data={item}
			/>
		</div>
	);

	return (
		<BaseCardStackWrapper
			deleteAction={deleteAction}
			gridClassName="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2 sm:gap-4"
			initial={initial}
			loadMoreAction={loadMoreAction}
			renderCard={renderCard}
		/>
	);
}
