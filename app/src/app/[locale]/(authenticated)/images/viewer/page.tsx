import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import { ImagesCounterLoader } from "@/loaders/images/images-counter-loader";
import { ImagesStackLoader } from "@/loaders/images/images-stack-loader";
import Loading from "@s-hirano-ist/s-ui/display/loading";
import { Suspense } from "react";

export default async function Page({
	searchParams,
}: PageProps<"/[locale]/images/viewer">) {
	const { page } = await searchParams;

	const currentPage = Number(page) || 1;

	return (
		<>
			<ErrorBoundary
				errorCaller="ImagesCounter"
				fallback={<div />}
				render={() => ImagesCounterLoader({})}
			/>

			<Suspense fallback={<Loading />} key={currentPage}>
				<ErrorBoundary
					errorCaller="ImagesStack"
					render={() =>
						ImagesStackLoader({
							currentPage,
							variant: "exported",
						})
					}
				/>
			</Suspense>
		</>
	);
}
