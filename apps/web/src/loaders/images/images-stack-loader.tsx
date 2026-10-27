import "server-only";
import type { DeleteAction, LoadMoreAction } from "@/common/types";
import type { ImageData } from "@/components/common/display/image/image-stack";
import type { CardStackInitialData } from "@/components/common/layouts/cards/types";
import type { BaseLoaderProps } from "@/loaders/types";
import {
	getExportedImages,
	getUnexportedImages,
} from "@/application-services/images/get-images";
import { ImagesStack } from "@/components/images/server/images-stack";

export type ImagesStackLoaderProps = BaseLoaderProps & {
	deleteAction?: DeleteAction;
	loadMoreAction: LoadMoreAction<CardStackInitialData<ImageData>>;
	variant: "exported" | "unexported";
};

export async function ImagesStackLoader({
	variant,
	deleteAction,
	loadMoreAction,
}: ImagesStackLoaderProps) {
	const getImages =
		variant === "exported" ? getExportedImages : getUnexportedImages;
	const initialData = await getImages(0);
	return (
		<ImagesStack
			deleteAction={deleteAction}
			initialData={initialData}
			loadMoreAction={loadMoreAction}
		/>
	);
}
