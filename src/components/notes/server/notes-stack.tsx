import type {
	DeleteAction,
	GetPaginatedData,
	LoadMoreAction,
} from "@/common/types";
import { LinkCardStack } from "@/components/common/layouts/cards/link-card-stack";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";

export type Props = {
	getNotes: GetPaginatedData<LinkCardStackInitialData>;
	deleteNote?: DeleteAction;
	loadMoreAction: LoadMoreAction<LinkCardStackInitialData>;
};

export async function NotesStack({
	getNotes,
	deleteNote,
	loadMoreAction,
}: Props) {
	const notes = await getNotes(0);

	return (
		<LinkCardStack
			deleteAction={deleteNote}
			initial={notes}
			loadMoreAction={loadMoreAction}
		/>
	);
}
