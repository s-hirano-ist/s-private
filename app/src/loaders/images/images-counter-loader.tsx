import "server-only";

import { makeExportedStatus } from "@s-hirano-ist/s-core/common/entities/common-entity";
import { getImagesCount } from "@/application-services/images/get-images";
import { ImagesCounter } from "@/components/images/server/images-counter";
import type { CounterLoaderProps } from "@/loaders/types";

export type ImagesCounterLoaderProps = CounterLoaderProps;

export async function ImagesCounterLoader(_props: ImagesCounterLoaderProps) {
	const count = await getImagesCount(makeExportedStatus().status);

	return <ImagesCounter count={count} />;
}
