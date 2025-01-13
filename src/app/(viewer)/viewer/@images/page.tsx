import { Unauthorized } from "@/components/card/unauthorized";
import { ImageStackSkeleton } from "@/components/stack/image-stack-skeleton";
import { Pagination } from "@/components/stack/pagination";
import { Badge } from "@/components/ui/badge";
import {
	checkSelfAuthOrRedirectToAuth,
	getUserId,
} from "@/features/auth/utils/get-session";
import { hasContentsPermission } from "@/features/auth/utils/role";
import { AllImageStack } from "@/features/image/components/all-image-stack";
import prisma from "@/prisma";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

type Params = Promise<{ page?: string }>;

export default async function Page({ params }: { params: Params }) {
	await checkSelfAuthOrRedirectToAuth();

	const hasAdminPermission = await hasContentsPermission();

	const { page } = await params;

	const currentPage = Number(page) || 1;

	const userId = await getUserId();
	const totalImages = await prisma.images.count({
		where: { userId },
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
