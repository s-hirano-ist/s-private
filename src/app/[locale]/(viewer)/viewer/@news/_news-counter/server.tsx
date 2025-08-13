import { forbidden } from "next/navigation";
import { ContentsPagination } from "@/components/contents-pagination";
import { CountBadge } from "@/components/count-badge";
import { Unexpected } from "@/components/status/unexpected";
import { PAGE_SIZE } from "@/constants";
import { getNewsCount } from "@/features/news/actions/get-news";
import { hasViewerAdminPermission } from "@/utils/auth/session";

type Props = { page: number };

export async function NewsCounter({ page }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	const totalNews = await getNewsCount("EXPORTED");
	const totalPages = Math.ceil(totalNews / PAGE_SIZE);

	try {
		return (
			<>
				<CountBadge label="totalNews" total={totalNews} />
				<ContentsPagination currentPage={page} totalPages={totalPages} />
			</>
		);
	} catch (error) {
		return <Unexpected caller="NewsCounter" error={error} />;
	}
}
