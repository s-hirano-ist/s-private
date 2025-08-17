import type { getImagesCount } from "@/application-services/images/get-images";
import { CounterBadge } from "@/components/common/display/counter-badge";

type Props = {
	currentPage: number;
	getImagesCount: typeof getImagesCount;
};

export async function ImagesCounter({ currentPage, getImagesCount }: Props) {
	const totalImages = await getImagesCount("EXPORTED");

	return <CounterBadge label="totalImages" totalItems={totalImages.count} />;
}
