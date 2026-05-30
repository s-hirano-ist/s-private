import { addImage } from "@/application-services/images/add-image";
import { deleteImage } from "@/application-services/images/delete-image";
import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import { ImageFormLoader } from "@/loaders/images/image-form-loader";
import { ImagesStackLoader } from "@/loaders/images/images-stack-loader";
import Loading from "@s-hirano-ist/s-ui/display/loading";
import { Suspense } from "react";

type Params = Promise<{ page?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
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
