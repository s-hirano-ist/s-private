import { forbidden } from "next/navigation";
import { LinkCardData } from "@/components/card/link-card";
import { LinkCardStack } from "@/components/card/link-card-stack";
import { Unexpected } from "@/components/status/unexpected";
import { hasViewerAdminPermission } from "@/utils/auth/session";
import { ServerAction } from "@/utils/types";

type Props = {
	page: number;
	getNews: (page: number) => Promise<LinkCardData[]>;
	deleteNews?: (id: string) => Promise<ServerAction>;
};

export async function NewsStack({ page, getNews, deleteNews }: Props) {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const data = await getNews(page);

		return (
			<LinkCardStack
				data={data}
				deleteAction={deleteNews}
				showDeleteButton={deleteNews !== undefined}
			/>
		);
	} catch (error) {
		return <Unexpected caller="NewsStack" error={error} />;
	}
}
