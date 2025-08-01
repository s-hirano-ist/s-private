import { Suspense } from "react";
import { AllImageStack } from "@/app/[locale]/(dumper)/@image/components/all-image-stack";
import { Unauthorized } from "@/components/card/unauthorized";
import { CountBadge } from "@/components/count-badge";
import { ImageStackSkeleton } from "@/components/stack/image-stack-skeleton";
import { Pagination } from "@/components/stack/pagination";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import prisma from "@/prisma";

type Props = { currentPage: number };

export async function SuspensePage({ currentPage }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();

	const totalImages = await prisma.staticImages.count({});

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
