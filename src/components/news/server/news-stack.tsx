import type { ServerAction } from "@/common/types";
import type { LinkCardData } from "@/components/common/layouts/cards/link-card";
import { LinkCardStack } from "@/components/common/layouts/cards/link-card-stack";

type Props = {
	currentPage: number;
	getNews: (page: number) => Promise<LinkCardData[]>;
	deleteNews?: (id: string) => Promise<ServerAction>;
};

export async function NewsStack({ currentPage, getNews, deleteNews }: Props) {
	const data = await getNews(currentPage);

	return (
		<LinkCardStack
			data={data}
			deleteAction={deleteNews}
			showDeleteButton={deleteNews !== undefined}
		/>
	);
}
