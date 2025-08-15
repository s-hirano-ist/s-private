import { forbidden } from "next/navigation";
import { BadgeWithPagination } from "@/components/badge-with-pagination";
import { Unexpected } from "@/components/status/unexpected";
import { getNewsCount } from "@/features/news/actions/get-news";
import { hasViewerAdminPermission } from "@/utils/auth/session";

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
