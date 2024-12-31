import { Unauthorized } from "@/components/unauthorized";
import { checkSelfAuthOrRedirectToAuth } from "@/features/auth/utils/get-session";
import { hasContentsPermission } from "@/features/auth/utils/role";
import { AllImageStackProvider } from "@/features/image/components/all-image-stack-provider";
import { ImagePagination } from "@/features/image/components/image-pagination";
import { ImageStackSkeleton } from "@/features/image/components/image-stack-skeleton";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

type Params = Promise<{ page?: string }>;

export default async function Page({ params }: { params: Params }) {
	await checkSelfAuthOrRedirectToAuth();

	const hasAdminPermission = await hasContentsPermission();

	const { page } = await params;

	const currentPage = Number(page) || 1;

	return (
		<>
			{hasAdminPermission ? (
				<>
					<ImagePagination currentPage={currentPage} />
					<Suspense key={currentPage} fallback={<ImageStackSkeleton />}>
						<AllImageStackProvider page={currentPage} />
					</Suspense>
				</>
			) : (
				<Unauthorized />
			)}
		</>
	);
}
