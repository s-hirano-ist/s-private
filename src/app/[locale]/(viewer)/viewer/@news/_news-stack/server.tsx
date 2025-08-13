import { forbidden } from "next/navigation";
import { LinkCardStack } from "@/components/card/link-card-stack";
import { Unexpected } from "@/components/status/unexpected";
import { getExportedNews } from "@/features/news/actions/get-news";
import { hasViewerAdminPermission } from "@/utils/auth/session";

type Props = { page: number };

export async function NewsStack({ page }: Props) {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const news = await getExportedNews(page);
		return <LinkCardStack data={news} showDeleteButton={false} />;
	} catch (error) {
		return <Unexpected caller="NewsStack" error={error} />;
	}
}
