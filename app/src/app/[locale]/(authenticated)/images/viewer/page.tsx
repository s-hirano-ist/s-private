import { loadMoreExportedImages } from "@/application-services/images/load-more-images";
import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import { ImagesCounterLoader } from "@/loaders/images/images-counter-loader";
import { ImagesStackLoader } from "@/loaders/images/images-stack-loader";
import { LoadingIndicator as Loading } from "@s-hirano-ist/s-ui/loading-indicator";
import { Suspense } from "react";

function ImagesContent() {
	return (
		<ErrorBoundary
			errorCaller="ImagesStack"
			render={() =>
				ImagesStackLoader({
					loadMoreAction: loadMoreExportedImages,
					variant: "exported",
				})
			}
		/>
	);
}

export default function Page() {
	return (
		<>
			<Suspense fallback={null}>
				<ErrorBoundary
					errorCaller="ImagesCounter"
					fallback={<div />}
					render={() => ImagesCounterLoader({})}
				/>
			</Suspense>

			<Suspense fallback={<Loading />}>
				<ImagesContent />
			</Suspense>
		</>
	);
}
