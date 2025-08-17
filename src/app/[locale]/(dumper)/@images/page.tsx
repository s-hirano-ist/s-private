import { Suspense } from "react";
import { addImages } from "@/application-services/images/add-images";
import { deleteImages } from "@/application-services/images/delete-images";
import {
	getExportedImages,
	getImagesCount,
	getUnexportedImages,
} from "@/application-services/images/get-images";
import {
	hasDumperPostPermission,
	hasViewerAdminPermission,
} from "@/common/auth/session";
import Loading from "@/components/common/display/loading";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { LazyTabContent } from "@/components/common/layouts/lazy-tab-content";
import { ImagesCounter } from "@/components/images/server/images-counter";
import { ImagesForm } from "@/components/images/server/images-form";
import { ImagesStack } from "@/components/images/server/images-stack";

type Params = Promise<{ page?: string; tab?: string; layout?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab, layout } = await searchParams;

	const currentPage = Number(page) || 1;

	// Only render if this tab is active or no tab is specified (defaults to "news")
	if (tab && tab !== "images") return null;

	const content = (() => {
		switch (layout) {
			case "viewer":
				return (
					<>
						<ErrorPermissionBoundary
							errorCaller="ImagesCounter"
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
			case "dumper":
			default:
				return (
					<>
						<ErrorPermissionBoundary
							errorCaller="ImagesForm"
							permissionCheck={hasDumperPostPermission}
							render={() => ImagesForm({ addImage: addImages })}
						/>

						<Suspense fallback={<Loading />}>
							<ErrorPermissionBoundary
								errorCaller="ImagesStack"
								permissionCheck={hasViewerAdminPermission}
								render={() =>
									ImagesStack({
										deleteImages,
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
