import { ServerAction, ServerActionWithData } from "@/common/types";
import {
	LinkCardStack,
	LinkCardStackInitialData,
} from "@/components/common/layouts/cards/link-card-stack";

export type Props = {
	getContents: (page: number) => Promise<LinkCardStackInitialData>;
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
