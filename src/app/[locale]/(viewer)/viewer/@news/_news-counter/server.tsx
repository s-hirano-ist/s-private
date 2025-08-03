import { forbidden } from "next/navigation";
import { StatusCodeView } from "@/components/card/status-code-view";
import { getStaticNewsCount } from "@/features/viewer/actions/static-news";
import { hasViewerAdminPermission } from "@/utils/auth/session";
import { NewsCounterClient } from "./client";

type Props = { page: number };

export async function NewsCounter({ page }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	const totalNews = await getStaticNewsCount();

	try {
		return <NewsCounterClient page={page} totalNews={totalNews} />;
	} catch (error) {
		return <StatusCodeView statusCode="500" />;
	}
}
