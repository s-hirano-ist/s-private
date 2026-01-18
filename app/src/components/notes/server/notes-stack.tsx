import type { DeleteAction, LoadMoreAction } from "@/common/types";
import { LinkCardStack } from "@/components/common/layouts/cards/link-card-stack";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";

export type Props = {
	initialData: LinkCardStackInitialData;
	deleteAction?: DeleteAction;
	loadMoreAction: LoadMoreAction<LinkCardStackInitialData>;
};

export function NotesStack({
	initialData,
	deleteAction,
	loadMoreAction,
}: Props) {
	return (
		<LinkCardStack
			deleteAction={deleteAction}
			initial={initialData}
			loadMoreAction={loadMoreAction}
		/>
	);
}
