import { deleteImage } from "@/application-services/images/delete-image";
import { loadMoreUnexportedImages } from "@/application-services/images/load-more-images";
import { renderContentListPage } from "@/components/common/layouts/content-list-page-server";
import { ImagesStackLoader } from "@/loaders/images/images-stack-loader";

// Keep ordinary client navigations fresh for the same 60s as private content.
export const unstable_dynamicStaleTime = 60;

export default function Page() {
	return renderContentListPage({
		stack: {
			errorCaller: "ImagesStack",
			render: () =>
				ImagesStackLoader({
					deleteAction: deleteImage,
					loadMoreAction: loadMoreUnexportedImages,
					variant: "unexported",
				}),
		},
	});
}
