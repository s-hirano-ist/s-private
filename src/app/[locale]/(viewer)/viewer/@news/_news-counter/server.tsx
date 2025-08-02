import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { getStaticNewsCount } from "@/features/viewer/actions/static-news";
import { NewsCounterClient } from "./client";

type Props = { page: number };

export async function NewsCounter({ page }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	const totalNews = await getStaticNewsCount();

	return <NewsCounterClient page={page} totalNews={totalNews} />;
}
