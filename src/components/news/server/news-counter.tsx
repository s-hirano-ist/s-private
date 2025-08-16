import { forbidden } from "next/navigation";
import { getNewsCount } from "@/applications/news/get-news";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { BadgeWithPagination } from "@/components/common/badge-with-pagination";
import { Unexpected } from "@/components/common/status/unexpected";

type Props = { page: number };

export async function NewsCounter({ page }: Props) {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const totalNews = await getNewsCount("EXPORTED");

		return (
			<BadgeWithPagination
				currentPage={page}
				label="totalNews"
				totalItems={totalNews}
			/>
		);
	} catch (error) {
		return <Unexpected caller="NewsCounter" error={error} />;
	}
}
