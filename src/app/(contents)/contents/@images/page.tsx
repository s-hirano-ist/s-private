import { Unauthorized } from "@/components/unauthorized";
import { checkSelfAuthOrRedirectToAuth } from "@/features/auth/utils/get-session";
import { checkAdminPermission } from "@/features/auth/utils/role";
import { AllImageStackProvider } from "@/features/image/components/all-image-stack-provider";
import { ImagePagination } from "@/features/image/components/image-pagination";
import { ImageStackSkeleton } from "@/features/image/components/image-stack-skeleton";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Page({
	searchParams,
}: { searchParams?: { page?: string } }) {
	await checkSelfAuthOrRedirectToAuth();

	const hasAdminPermission = await checkAdminPermission();

	const currentPage = Number(searchParams?.page) || 1;

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
