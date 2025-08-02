import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { getStaticNews } from "@/features/viewer/actions/static-news";
import { StaticNewsStackClient } from "./client";

type Props = { page: number };

export async function StaticNewsStack({ page }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	const news = await getStaticNews(page);
	return <StaticNewsStackClient data={news} />;
}
