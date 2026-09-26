import { deleteImage } from "@/application-services/images/delete-image";
import { loadMoreUnexportedImages } from "@/application-services/images/load-more-images";
import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import { ImagesStackLoader } from "@/loaders/images/images-stack-loader";
import { LoadingIndicator as Loading } from "@s-hirano-ist/s-ui/loading-indicator";
import { Suspense } from "react";

function ImagesContent() {
	return (
		<ErrorBoundary
			errorCaller="ImagesStack"
			render={() =>
				ImagesStackLoader({
					deleteAction: deleteImage,
					loadMoreAction: loadMoreUnexportedImages,
					variant: "unexported",
				})
			}
		/>
	);
}

export default function Page() {
	return (
		<Suspense fallback={<Loading />}>
			<ImagesContent />
		</Suspense>
	);
}
