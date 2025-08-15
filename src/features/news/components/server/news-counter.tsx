import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { BadgeWithPagination } from "@/common/components/badge-with-pagination";
import { Unexpected } from "@/common/components/status/unexpected";
import { getNewsCount } from "@/features/news/actions/get-news";

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
