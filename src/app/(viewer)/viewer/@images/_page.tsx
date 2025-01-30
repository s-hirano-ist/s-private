import { Unauthorized } from "@/components/card/unauthorized";
import { ImageStackSkeleton } from "@/components/stack/image-stack-skeleton";
import { Pagination } from "@/components/stack/pagination";
import { Badge } from "@/components/ui/badge";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { AllImageStack } from "@/features/image/components/all-image-stack";
import prisma from "@/prisma";
import { Suspense } from "react";

type Props = { currentPage: number };

export async function SuspensePage({ currentPage }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();

	const totalImages = await prisma.staticImages.count({});

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
