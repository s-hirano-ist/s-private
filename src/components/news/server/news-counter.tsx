import type { getNewsCount } from "@/application-services/news/get-news";
import { BadgeWithPagination } from "@/components/common/display/badge-with-pagination";

type Props = { currentPage: number; getNewsCount: typeof getNewsCount };

export async function NewsCounter({ currentPage, getNewsCount }: Props) {
	const totalNews = await getNewsCount("EXPORTED");

	return (
		<BadgeWithPagination
			currentPage={currentPage}
			itemsPerPage={totalNews.pageSize}
			label="totalNews"
			totalItems={totalNews.count}
		/>
	);
}
