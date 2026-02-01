"use client";
import type { DeleteAction, LoadMoreAction } from "@/common/types";
import { DeleteButtonWithModal } from "@/components/common/forms/actions/delete-button-with-modal";
import { BaseCardStackWrapper } from "@/components/common/layouts/cards/base-card-stack";
import { ImageCard } from "@/components/common/layouts/cards/image-card";
import type { ImageCardStackInitialData } from "./types";

type Props = {
	initial: ImageCardStackInitialData;
	basePath: string;
	deleteAction?: DeleteAction;
	loadMoreAction: LoadMoreAction<ImageCardStackInitialData>;
};

export function ImageCardStack({
	initial,
	basePath,
	deleteAction,
	loadMoreAction,
}: Props) {
	return (
		<BaseCardStackWrapper
			deleteAction={deleteAction}
			gridClassName="my-2 grid grid-cols-2 items-stretch gap-4 sm:grid-cols-3 lg:grid-cols-4"
			initial={initial}
			loadMoreAction={loadMoreAction}
		>
			{({ item, isLast, lastElementRef, deleteAction, itemKey }) => (
				<div
					className="h-full"
					key={itemKey}
					ref={isLast ? lastElementRef : null}
				>
					<ImageCard
						actions={
							deleteAction !== undefined ? (
								<DeleteButtonWithModal
									deleteAction={deleteAction}
									id={item.id}
									title={item.title}
								/>
							) : undefined
						}
						basePath={basePath}
						data={item}
					/>
				</div>
			)}
		</BaseCardStackWrapper>
	);
}
