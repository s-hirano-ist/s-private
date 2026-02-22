import Loading from "@s-hirano-ist/s-ui/display/loading";
import { Suspense } from "react";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { ImagesCounterLoader } from "@/loaders/images/images-counter-loader";
import { ImagesStackLoader } from "@/loaders/images/images-stack-loader";

type Params = Promise<{ page?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page } = await searchParams;

	const currentPage = Number(page) || 1;

	return (
		<>
			<ErrorPermissionBoundary
				errorCaller="ImagesCounter"
				fallback={<div />}
				permissionCheck={hasViewerAdminPermission}
				render={() => ImagesCounterLoader({})}
			/>

			<Suspense fallback={<Loading />} key={currentPage}>
				<ErrorPermissionBoundary
					errorCaller="ImagesStack"
					permissionCheck={hasViewerAdminPermission}
					render={() =>
						ImagesStackLoader({
							currentPage,
							variant: "exported",
						})
					}
				/>
			</Suspense>
		</>
	);
}
