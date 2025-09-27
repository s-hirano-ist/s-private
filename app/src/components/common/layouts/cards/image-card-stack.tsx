"use client";
import type { DeleteAction, LoadMoreAction } from "@/common/types";
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
	const showDeleteButton = deleteAction !== undefined;

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
				basePath={basePath}
				data={item}
				deleteAction={deleteAction}
				showDeleteButton={showDeleteButton}
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
