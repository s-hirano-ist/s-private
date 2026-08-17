import { addImage } from "@/application-services/images/add-image";
import { deleteImage } from "@/application-services/images/delete-image";
import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import { ImageFormLoader } from "@/loaders/images/image-form-loader";
import { ImagesStackLoader } from "@/loaders/images/images-stack-loader";
import { LoadingIndicator as Loading } from "@s-hirano-ist/s-ui/loading-indicator";
import { Suspense } from "react";

export default async function Page({
	searchParams,
}: PageProps<"/[locale]/images">) {
	const { page } = await searchParams;

	const currentPage = Number(page) || 1;

	return (
		<>
			<ErrorBoundary
				errorCaller="ImageForm"
				render={() => ImageFormLoader({ addImage })}
			/>

			<Suspense fallback={<Loading />} key={currentPage}>
				<ErrorBoundary
					errorCaller="ImagesStack"
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
