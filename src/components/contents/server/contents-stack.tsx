import { ServerAction } from "@/common/types";
import { LinkCardData } from "@/components/common/layouts/cards/link-card";
import { LinkCardStack } from "@/components/common/layouts/cards/link-card-stack";

type Props = {
	page: number;
	getContents: (page: number) => Promise<LinkCardData[]>;
	deleteContents?: (id: string) => Promise<ServerAction>;
};

export async function ContentsStack({
	page,
	getContents,
	deleteContents,
}: Props) {
	const data = await getContents(page);

	return (
		<LinkCardStack
			data={data}
			deleteAction={deleteContents}
			showDeleteButton={deleteContents !== undefined}
		/>
	);
}
