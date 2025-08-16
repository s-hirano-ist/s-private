import { Suspense } from "react";
import {
	getExportedImages,
	getImagesCount,
} from "@/applications/images/get-images";
import Loading from "@/common/components/loading";
import { ImageCounter } from "@/features/images/components/server/image-counter";
import { ImageStack } from "@/features/images/components/server/image-stack";

type Params = Promise<{ page?: string; tab?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab } = await searchParams;

	const currentPage = Number(page) || 1;

	// Only render if this tab is active or no tab is specified (defaults to "news")
	if (tab && tab !== "images") return <div />;

	return (
		<>
			<ImageCounter getImagesCount={getImagesCount} page={currentPage} />

			<Suspense fallback={<Loading />} key={currentPage}>
				<ImageStack getImages={getExportedImages} page={currentPage} />
			</Suspense>
		</>
	);
}
