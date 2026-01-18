import { makeExportedStatus } from "@s-hirano-ist/s-core/common/entities/common-entity";
import type { getImagesCount } from "@/application-services/images/get-images";
import { CounterBadge } from "@/components/common/display/counter-badge";

export type Props = {
	getImagesCount: typeof getImagesCount;
};

export async function ImagesCounter({ getImagesCount }: Props) {
	const imagesCount = await getImagesCount(makeExportedStatus().status);

	return <CounterBadge label="totalImages" totalItems={imagesCount} />;
}
