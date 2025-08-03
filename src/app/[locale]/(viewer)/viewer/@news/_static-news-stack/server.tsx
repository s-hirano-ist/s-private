import { forbidden } from "next/navigation";
import { StatusCodeView } from "@/components/card/status-code-view";
import { getStaticNews } from "@/features/viewer/actions/static-news";
import { hasViewerAdminPermission } from "@/utils/auth/session";
import { StaticNewsStackClient } from "./client";

type Props = { page: number };

export async function StaticNewsStack({ page }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	try {
		const news = await getStaticNews(page);
		return <StaticNewsStackClient data={news} />;
	} catch (error) {
		return <StatusCodeView statusCode="500" />;
	}
}
