import { LinkCardData } from "@/components/card/link-card";
import { LinkCardStack } from "@/components/card/link-card-stack";
import { ServerAction } from "@/types";

type Props = {
	data: LinkCardData[];
	deleteNews: (id: number) => Promise<ServerAction<number>>;
};

export function NewsStackClient({ data, deleteNews }: Props) {
	return (
		<LinkCardStack data={data} deleteAction={deleteNews} showDeleteButton />
	);
}
