import { Suspense } from "react";
import { ImageStackSkeleton } from "@/components/image/image-stack-skeleton";
import {
	getExportedImages,
	getImagesCount,
} from "@/features/images/actions/get-images";
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

			<Suspense fallback={<ImageStackSkeleton />} key={currentPage}>
				<ImageStack getImages={getExportedImages} page={currentPage} />
			</Suspense>
		</>
	);
}
