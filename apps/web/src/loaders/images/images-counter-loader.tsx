import "server-only";
import type { CounterLoaderProps } from "@/loaders/types";
import { getImagesCount } from "@/application-services/images/get-images";
import { ViewerCountSync } from "@/components/common/layouts/nav/viewer-count-context";

export type ImagesCounterLoaderProps = CounterLoaderProps;

export async function ImagesCounterLoader(_props: ImagesCounterLoaderProps) {
	const count = await getImagesCount("EXPORTED");

	return <ViewerCountSync count={count} domain="images" />;
}
