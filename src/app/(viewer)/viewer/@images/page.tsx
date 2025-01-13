import { StatusCodeView } from "@/components/card/status-code-view";
import { Unauthorized } from "@/components/card/unauthorized";
import { ImageStackSkeleton } from "@/components/stack/image-stack-skeleton";
import { Pagination } from "@/components/stack/pagination";
import { Badge } from "@/components/ui/badge";
import { ERROR_MESSAGES } from "@/constants";
import {
	checkSelfAuthOrRedirectToAuth,
	getUserId,
} from "@/features/auth/utils/get-session";
import { hasContentsPermission } from "@/features/auth/utils/role";
import { AllImageStack } from "@/features/image/components/all-image-stack";
import { loggerError } from "@/pino";
import prisma from "@/prisma";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

type Params = Promise<{ page?: string }>;

export default async function Page({ params }: { params: Params }) {
	try {
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
	} catch (error) {
		loggerError(
			ERROR_MESSAGES.UNEXPECTED,
			{
				caller: "ImagePage",
				status: 500,
			},
			error,
		);
		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
