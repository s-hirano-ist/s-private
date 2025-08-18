import { GetContents } from "@/application-services/contents/get-contents";
import { ServerAction, ServerActionWithData } from "@/common/types";
import { LinkCardStack } from "@/components/common/layouts/cards/link-card-stack";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";

export type Props = {
	getContents: GetContents;
	deleteContents?: (id: string) => Promise<ServerAction>;
	loadMoreAction: (
		currentCount: number,
	) => Promise<ServerActionWithData<LinkCardStackInitialData>>;
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
