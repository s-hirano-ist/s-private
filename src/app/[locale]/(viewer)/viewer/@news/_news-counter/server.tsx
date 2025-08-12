import { forbidden } from "next/navigation";
import { StatusCodeView } from "@/components/status/status-code-view";
import { getNewsCount } from "@/features/news/actions/get-news";
import { loggerError } from "@/pino";
import { hasViewerAdminPermission } from "@/utils/auth/session";
import { NewsCounterClient } from "./client";

type Props = { page: number };

export async function NewsCounter({ page }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	const totalNews = await getNewsCount();

	try {
		return <NewsCounterClient page={page} totalNews={totalNews} />;
	} catch (error) {
		loggerError("unexpected", { caller: "NewsCounter", status: 500 }, error);
		return <StatusCodeView statusCode="500" />;
	}
}
