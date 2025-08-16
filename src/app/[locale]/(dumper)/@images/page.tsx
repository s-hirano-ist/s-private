import { Suspense } from "react";
import { addImage } from "@/application-services/images/add-image";
import { deleteImages } from "@/application-services/images/delete-images";
import {
	getExportedImages,
	getImagesCount,
	getUnexportedImages,
} from "@/application-services/images/get-images";
import Loading from "@/components/common/display/loading";
import { ImageCounter } from "@/components/images/server/image-counter";
import { ImageForm } from "@/components/images/server/image-form";
import { ImageStack } from "@/components/images/server/image-stack";

type Params = Promise<{ page?: string; tab?: string; layout?: string }>;

export default async function Page({ searchParams }: { searchParams: Params }) {
	const { page, tab, layout } = await searchParams;

	const currentPage = Number(page) || 1;

	// Only render if this tab is active or no tab is specified (defaults to "news")
	if (tab && tab !== "images") return <div />;

	switch (layout) {
		case "viewer":
			return (
				<>
					<ImageCounter
						currentPage={currentPage}
						getImagesCount={getImagesCount}
					/>

					<Suspense fallback={<Loading />} key={currentPage}>
						<ImageStack getImages={getExportedImages} page={currentPage} />
					</Suspense>
				</>
			);
		case "dumper":
		default:
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
}
