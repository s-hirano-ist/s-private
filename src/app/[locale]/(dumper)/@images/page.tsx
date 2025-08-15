import { Suspense } from "react";
import Loading from "@/common/components/loading";
import { addImage } from "@/features/images/actions/add-image";
import { deleteImages } from "@/features/images/actions/delete-images";
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

			<Suspense fallback={<Loading />}>
				<ImageStack
					deleteImages={deleteImages}
					getImages={getUnexportedImages}
					page={currentPage}
				/>
			</Suspense>
		</>
	);
}
