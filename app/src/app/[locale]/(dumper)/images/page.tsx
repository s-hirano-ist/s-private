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
import { ImagesStackLoader } from "@/loaders/images/images-stack-loader";

type Params = Promise<{ page?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page } = await searchParams;

	const currentPage = Number(page) || 1;

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
							variant: "unexported",
						})
					}
				/>
			</Suspense>
		</>
	);
}
