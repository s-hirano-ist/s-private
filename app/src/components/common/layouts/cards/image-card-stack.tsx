"use client";
import type { DeleteAction, LoadMoreAction } from "@/common/types";
import { DeleteButtonWithModal } from "@/components/common/forms/actions/delete-button-with-modal";
import { BaseCardStackWrapper } from "@/components/common/layouts/cards/base-card-stack";
import { ImageCard } from "@/components/common/layouts/cards/image-card";
import type { ImageCardData, ImageCardStackInitialData } from "./types";

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
	const renderCard = (
		item: ImageCardData,
		_index: number,
		isLast: boolean,
		lastElementRef: (node: HTMLElement | null) => void,
		deleteAction?: DeleteAction,
		key?: string,
	) => (
		<div className="h-full" key={key} ref={isLast ? lastElementRef : null}>
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
	);

	return (
		<BaseCardStackWrapper
			deleteAction={deleteAction}
			gridClassName="my-2 grid grid-cols-2 items-stretch gap-4 sm:grid-cols-3 lg:grid-cols-4"
			initial={initial}
			loadMoreAction={loadMoreAction}
			renderCard={renderCard}
		/>
	);
}
