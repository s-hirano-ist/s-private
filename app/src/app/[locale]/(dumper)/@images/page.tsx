import Loading from "@s-hirano-ist/s-ui/display/loading";
import { Suspense } from "react";
import { addImage } from "@/application-services/images/add-image";
import { deleteImage } from "@/application-services/images/delete-image";
import {
	getExportedImages,
	getImagesCount,
	getUnexportedImages,
} from "@/application-services/images/get-images";
import {
	hasDumperPostPermission,
	hasViewerAdminPermission,
} from "@/common/auth/session";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { LazyTabContent } from "@/components/common/lazy-tab-content";
import { ImageForm } from "@/components/images/server/image-form";
import { ImagesCounter } from "@/components/images/server/images-counter";
import { ImagesStack } from "@/components/images/server/images-stack";

type Params = Promise<{ page?: string; tab?: string; layout?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab, layout } = await searchParams;

	const currentPage = Number(page) || 1;

	// Only render if this tab is active or no tab is specified
	if (tab && tab !== "images") return null;

	const content = (() => {
		switch (layout) {
			case "viewer":
				return (
					<>
						<ErrorPermissionBoundary
							errorCaller="ImagesCounter"
							fallback={<div />}
							permissionCheck={hasViewerAdminPermission}
							render={() => ImagesCounter({ getImagesCount })}
						/>

						<Suspense fallback={<Loading />} key={currentPage}>
							<ErrorPermissionBoundary
								errorCaller="ImagesStack"
								permissionCheck={hasViewerAdminPermission}
								render={() =>
									ImagesStack({ currentPage, getImages: getExportedImages })
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
							render={() => ImageForm({ addImage })}
						/>

						<Suspense fallback={<Loading />}>
							<ErrorPermissionBoundary
								errorCaller="ImagesStack"
								permissionCheck={hasViewerAdminPermission}
								render={() =>
									ImagesStack({
										deleteImage,
										currentPage,
										getImages: getUnexportedImages,
									})
								}
							/>
						</Suspense>
					</>
				);
		}
	})();

	return (
		<LazyTabContent fallback={<Loading />} tabName="images">
			{content}
		</LazyTabContent>
	);
}
