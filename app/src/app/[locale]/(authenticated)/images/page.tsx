import { deleteImage } from "@/application-services/images/delete-image";
import { ErrorBoundary } from "@/components/common/layouts/error-boundary";
import { ImagesStackLoader } from "@/loaders/images/images-stack-loader";
import { LoadingIndicator as Loading } from "@s-hirano-ist/s-ui/loading-indicator";
import { Suspense } from "react";

type ImagesContentProps = Pick<PageProps<"/[locale]/images">, "searchParams">;

async function ImagesContent({ searchParams }: ImagesContentProps) {
	const { page } = await searchParams;
	const currentPage = Number(page) || 1;

	return (
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
	);
}

export default function Page({ searchParams }: PageProps<"/[locale]/images">) {
	return (
		<Suspense fallback={<Loading />}>
			<ImagesContent searchParams={searchParams} />
		</Suspense>
	);
}
