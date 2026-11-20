import { deleteImage } from "@/application-services/images/delete-image";
import { loadMoreExportedImages } from "@/application-services/images/load-more-images";
import { renderContentListPage } from "@/components/common/layouts/content-list-page-server";
import { ImagesCounterLoader } from "@/loaders/images/images-counter-loader";
import { ImagesStackLoader } from "@/loaders/images/images-stack-loader";

// Keep ordinary client navigations fresh for the same 60s as private content.
export const unstable_dynamicStaleTime = 60;

export default function Page() {
	return renderContentListPage({
		counter: {
			errorCaller: "ImagesCounter",
			render: () => ImagesCounterLoader({}),
		},
		stack: {
			errorCaller: "ImagesStack",
			render: () =>
				ImagesStackLoader({
					loadMoreAction: loadMoreExportedImages,
					variant: "exported",
					deleteAction: deleteImage,
				}),
		},
	});
}
