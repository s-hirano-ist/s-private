import { Suspense } from "react";
import { Unauthorized } from "@/components/card/unauthorized";
import { CountBadge } from "@/components/count-badge";
import { ImageStackSkeleton } from "@/components/stack/image-stack-skeleton";
import { Pagination } from "@/components/stack/pagination";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { AllImageStack } from "@/features/image/components/all-image-stack";
import db from "@/db";
import { staticImages } from "@/db/schema";
import { count } from "drizzle-orm";

type Props = { currentPage: number };

export async function SuspensePage({ currentPage }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();

	const [result] = await db
		.select({ count: count() })
		.from(staticImages);
	const totalImages = result.count;

	return (
		<>
			{hasAdminPermission ? (
				<>
					<CountBadge label="totalImages" total={totalImages} />
					<Pagination currentPage={currentPage} totalPages={totalImages} />
					<Suspense fallback={<ImageStackSkeleton />} key={currentPage}>
						<AllImageStack page={currentPage} />
					</Suspense>
				</>
			) : (
				<Unauthorized />
			)}
		</>
	);
}
