import { forbidden } from "next/navigation";
import { StatusCodeView } from "@/components/card/status-code-view";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { getStaticNewsCount } from "@/features/viewer/actions/static-news";
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
