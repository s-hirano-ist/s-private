import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import { ImagesCounterLoader } from "@/loaders/images/images-counter-loader";
import { ImagesStackLoader } from "@/loaders/images/images-stack-loader";
import { LoadingIndicator as Loading } from "@s-hirano-ist/s-ui/loading-indicator";
import { Suspense } from "react";

type ImagesContentProps = Pick<
	PageProps<"/[locale]/images/viewer">,
	"searchParams"
>;

async function ImagesContent({ searchParams }: ImagesContentProps) {
	const { page } = await searchParams;
	const currentPage = Number(page) || 1;

	return (
		<ErrorBoundary
			errorCaller="ImagesStack"
			render={() =>
				ImagesStackLoader({
					currentPage,
					variant: "exported",
				})
			}
		/>
	);
}

export default function Page({
	searchParams,
}: PageProps<"/[locale]/images/viewer">) {
	return (
		<>
			<Suspense fallback={<Loading />}>
				<ErrorBoundary
					errorCaller="ImagesCounter"
					fallback={<div />}
					render={() => ImagesCounterLoader({})}
				/>
			</Suspense>

			<Suspense fallback={<Loading />}>
				<ImagesContent searchParams={searchParams} />
			</Suspense>
		</>
	);
}
