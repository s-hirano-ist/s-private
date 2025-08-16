import { forbidden } from "next/navigation";
import type { getNewsCount } from "@/application-services/news/get-news";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { BadgeWithPagination } from "@/components/common/display/badge-with-pagination";
import { Unexpected } from "@/components/common/display/status/unexpected";

type Props = { currentPage: number; getNewsCount: typeof getNewsCount };

export async function NewsCounter({ currentPage, getNewsCount }: Props) {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const totalNews = await getNewsCount("EXPORTED");

		return (
			<BadgeWithPagination
				currentPage={currentPage}
				itemsPerPage={totalNews.pageSize}
				label="totalNews"
				totalItems={totalNews.count}
			/>
		);
	} catch (error) {
		return <Unexpected caller="NewsCounter" error={error} />;
	}
}
