import { Unauthorized } from "@/components/card/unauthorized";
import { CountBadge } from "@/components/count-badge";
import { CardStackSkeleton } from "@/components/stack/card-stack-skeleton";
import { Pagination } from "@/components/stack/pagination";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { AllNewsStack } from "@/features/news/components/all-news-stack";
import { getStaticNewsCount } from "@/features/viewer/actions/static-news";
import { Suspense } from "react";

type Props = { currentPage: number };

export async function SuspensePage({ currentPage }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();

	const totalNews = await getStaticNewsCount();

	return (
		<>
			{hasAdminPermission ? (
				<>
					<CountBadge label="totalNews" total={totalNews} />
					<Pagination currentPage={currentPage} totalPages={totalNews} />
					<Suspense fallback={<CardStackSkeleton />} key={currentPage}>
						<AllNewsStack page={currentPage} />
					</Suspense>
				</>
			) : (
				<Unauthorized />
			)}
		</>
	);
}
