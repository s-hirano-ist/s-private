import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { LinkCardData } from "@/common/components/card/link-card";
import { LinkCardStack } from "@/common/components/card/link-card-stack";
import { Unexpected } from "@/common/components/status/unexpected";
import { ServerAction } from "@/common/types";

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
