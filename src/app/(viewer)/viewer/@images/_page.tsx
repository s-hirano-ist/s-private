import { Unauthorized } from "@/components/card/unauthorized";
import { ImageStackSkeleton } from "@/components/stack/image-stack-skeleton";
import { Pagination } from "@/components/stack/pagination";
import { Badge } from "@/components/ui/badge";
import {
	getSelfId,
	hasViewerAdminPermission,
} from "@/features/auth/utils/session";
import { AllImageStack } from "@/features/image/components/all-image-stack";
import prisma from "@/prisma";
import { Suspense } from "react";

type Params = Promise<{ page?: string }>;

export async function SuspensePage({ params }: { params: Params }) {
	const hasAdminPermission = await hasViewerAdminPermission();

	const { page } = await params;

	const currentPage = Number(page) || 1;

	const userId = await getSelfId();
	const totalImages = await prisma.images.count({
		where: { userId },
		cacheStrategy: { ttl: 400, swr: 40, tags: ["images"] },
	});

	return (
		<>
			{hasAdminPermission ? (
				<>
					<Badge className="m-2 flex justify-center">
						画像数: {totalImages}
					</Badge>
					<Pagination currentPage={currentPage} totalPages={totalImages} />
					<Suspense key={currentPage} fallback={<ImageStackSkeleton />}>
						<AllImageStack page={currentPage} />
					</Suspense>
				</>
			) : (
				<Unauthorized />
			)}
		</>
	);
}
