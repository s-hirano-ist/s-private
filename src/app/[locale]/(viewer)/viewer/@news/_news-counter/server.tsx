import { forbidden } from "next/navigation";
import { BadgeWithPagination } from "@/components/badge-with-pagination";
import { Unexpected } from "@/components/status/unexpected";
import { PAGE_SIZE } from "@/constants";
import { getNewsCount } from "@/features/news/actions/get-news";
import { hasViewerAdminPermission } from "@/utils/auth/session";

type Props = { page: number };

export async function NewsCounter({ page }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	try {
		const totalNews = await getNewsCount("EXPORTED");

		return (
			<BadgeWithPagination
				currentPage={page}
				itemsPerPage={PAGE_SIZE}
				label="totalNews"
				totalItems={totalNews}
			/>
		);
	} catch (error) {
		return <Unexpected caller="NewsCounter" error={error} />;
	}
}
