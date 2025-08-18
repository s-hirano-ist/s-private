import { GetContents } from "@/application-services/contents/get-contents";
import { DeleteAction, LoadMoreAction } from "@/common/types";
import { LinkCardStack } from "@/components/common/layouts/cards/link-card-stack";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";

export type Props = {
	getContents: GetContents;
	deleteContents?: DeleteAction;
	loadMoreAction: LoadMoreAction<LinkCardStackInitialData>;
};

export async function ContentsStack({
	getContents,
	deleteContents,
	loadMoreAction,
}: Props) {
	const contents = await getContents(0);

	return (
		<LinkCardStack
			deleteAction={deleteContents}
			initial={contents}
			loadMoreAction={loadMoreAction}
		/>
	);
}
