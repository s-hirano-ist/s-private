import { Suspense } from "react";
import { ImageStackSkeleton } from "@/common/components/image/image-stack-skeleton";
import { addImage } from "@/features/images/actions/add-image";
import { getUnexportedImages } from "@/features/images/actions/get-images";
import { ImageForm } from "@/features/images/components/server/image-form";
import { ImageStack } from "@/features/images/components/server/image-stack";

type Params = Promise<{ page?: string; tab?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab } = await searchParams;

	const currentPage = Number(page) || 1;

	// Only render if this tab is active or no tab is specified (defaults to "news")
	if (tab && tab !== "images") return <div />;

	return (
		<>
			<ImageForm addImage={addImage} />

			<Suspense fallback={<ImageStackSkeleton />}>
				<ImageStack getImages={getUnexportedImages} page={currentPage} />
			</Suspense>
		</>
	);
}
