import "server-only";
import type { CounterLoaderProps } from "@/loaders/types";
import { getImagesCount } from "@/application-services/images/get-images";
import { ImagesCounter } from "@/components/images/server/images-counter";

export type ImagesCounterLoaderProps = CounterLoaderProps;

export async function ImagesCounterLoader(_props: ImagesCounterLoaderProps) {
	const count = await getImagesCount("EXPORTED");

	return <ImagesCounter count={count} />;
}
