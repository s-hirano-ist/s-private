import { makeStatus } from "s-private-domains/common/entities/common-entity";
import type { getImagesCount } from "@/application-services/images/get-images";
import { CounterBadge } from "@/components/common/display/counter-badge";

export type Props = {
	getImagesCount: typeof getImagesCount;
};

export async function ImagesCounter({ getImagesCount }: Props) {
	const imagesCount = await getImagesCount(makeStatus("EXPORTED"));

	return <CounterBadge label="totalImages" totalItems={imagesCount} />;
}
