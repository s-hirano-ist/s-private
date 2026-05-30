import "server-only";
import type { CounterLoaderProps } from "@/loaders/types";
import { getImagesCount } from "@/application-services/images/get-images";
import { ImagesCounter } from "@/components/images/server/images-counter";
import { makeExportedStatus } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";

export type ImagesCounterLoaderProps = CounterLoaderProps;

export async function ImagesCounterLoader(_props: ImagesCounterLoaderProps) {
	const count = await getImagesCount(makeExportedStatus().status);

	return <ImagesCounter count={count} />;
}
