import "server-only";

import {
	getExportedImages,
	getImagesCount,
	getUnexportedImages,
} from "@/application-services/images/get-images";
import type { ServerAction } from "@/common/types";
import { ImagesStack } from "@/components/images/server/images-stack";
import type { BaseLoaderProps } from "@/loaders/types";

export type ImagesStackLoaderProps = BaseLoaderProps & {
	variant: "exported" | "unexported";
	currentPage: number;
	deleteAction?: (id: string) => Promise<ServerAction>;
};

export async function ImagesStackLoader({
	variant,
	currentPage,
	deleteAction,
}: ImagesStackLoaderProps) {
	const status = variant === "exported" ? "EXPORTED" : "UNEXPORTED";
	const getImages =
		variant === "exported" ? getExportedImages : getUnexportedImages;

	const [images, totalCount] = await Promise.all([
		getImages(currentPage),
		getImagesCount(status),
	]);

	return (
		<ImagesStack
			currentPage={currentPage}
			data={images}
			deleteAction={deleteAction}
			totalCount={totalCount}
		/>
	);
}
