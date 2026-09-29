import { loadMoreExportedImages } from "@/application-services/images/load-more-images";
import { renderContentListPage } from "@/components/common/layouts/content-list-page-server";
import { ImagesCounterLoader } from "@/loaders/images/images-counter-loader";
import { ImagesStackLoader } from "@/loaders/images/images-stack-loader";

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
				}),
		},
	});
}
