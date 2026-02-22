import Loading from "@s-hirano-ist/s-ui/display/loading";
import { Suspense } from "react";
import { addImage } from "@/application-services/images/add-image";
import { deleteImage } from "@/application-services/images/delete-image";
import {
	hasDumperPostPermission,
	hasViewerAdminPermission,
} from "@/common/auth/session";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { ImageFormLoader } from "@/loaders/images/image-form-loader";
import { ImagesCounterLoader } from "@/loaders/images/images-counter-loader";
import { ImagesStackLoader } from "@/loaders/images/images-stack-loader";

type Params = Promise<{ page?: string; layout?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, layout } = await searchParams;

	const currentPage = Number(page) || 1;

	switch (layout) {
		case "viewer":
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
									layout,
									variant: "exported",
								})
							}
						/>
					</Suspense>
				</>
			);
		default:
			return (
				<>
					<ErrorPermissionBoundary
						errorCaller="ImageForm"
						permissionCheck={hasDumperPostPermission}
						render={() => ImageFormLoader({ addImage })}
					/>

					<Suspense fallback={<Loading />} key={currentPage}>
						<ErrorPermissionBoundary
							errorCaller="ImagesStack"
							permissionCheck={hasViewerAdminPermission}
							render={() =>
								ImagesStackLoader({
									currentPage,
									deleteAction: deleteImage,
									layout,
									variant: "unexported",
								})
							}
						/>
					</Suspense>
				</>
			);
	}
}
