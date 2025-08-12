import { forbidden } from "next/navigation";
import { StatusCodeView } from "@/components/status/status-code-view";
import { getNews } from "@/features/news/actions/get-news";
import { loggerError } from "@/pino";
import { hasViewerAdminPermission } from "@/utils/auth/session";
import { NewsStackClient } from "./client";

type Props = { page: number };

export async function NewsStack({ page }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	try {
		const news = await getNews(page);
		return <NewsStackClient data={news} />;
	} catch (error) {
		loggerError("unexpected", { caller: "NewsStack", status: 500 }, error);
		return <StatusCodeView statusCode="500" />;
	}
}
