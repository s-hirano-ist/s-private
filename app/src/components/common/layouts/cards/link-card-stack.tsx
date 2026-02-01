"use client";
import type { DeleteAction, LoadMoreAction } from "@/common/types";
import { DeleteButtonWithModal } from "@/components/common/forms/actions/delete-button-with-modal";
import { BaseCardStackWrapper } from "@/components/common/layouts/cards/base-card-stack";
import { LinkCard } from "@/components/common/layouts/cards/link-card";
import type { LinkCardStackInitialData } from "./types";

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
	return (
		<BaseCardStackWrapper
			deleteAction={deleteAction}
			gridClassName="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2 sm:gap-4"
			initial={initial}
			loadMoreAction={loadMoreAction}
		>
			{({ item, isLast, lastElementRef, deleteAction, itemKey }) => (
				<div
					className="h-full"
					key={itemKey}
					ref={isLast ? lastElementRef : null}
				>
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
			)}
		</BaseCardStackWrapper>
	);
}
